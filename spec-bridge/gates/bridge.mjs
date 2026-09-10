// bridge.mjs — read-only logic of the spec-bridge: find Backlog tasks linked to Spec Kit spec
// dirs and judge each task's kanban status against the state its spec artifacts prove.
//
// A task is "linked" by a marker line in its description: `Spec: <dir>` where <dir> is the spec
// directory relative to the project root (the dir holding backlog/). The marker is planted and
// maintained ONLY via the backlog CLI (link/sync skills); this module just reads the task files.
//
// Verdicts per linked task, comparing the task's frontmatter status to the derived status:
//   exceeds — status claims more than the artifacts prove (e.g. Done over unchecked boxes).
//             The Stop-hook gate blocks on these.
//   lags    — artifacts are ahead of the status (honest but stale). Warn, never block.
//   ok      — they agree.
//   unknown — the task uses a status outside To Do / In Progress / Done (custom workflow);
//             the bridge doesn't guess, so it neither blocks nor warns.
//
// A project MAY opt into a finer, phase-level status vocabulary via `statusVocabulary` in
// `.spec-bridge.json` (see vocabularyProfile): the same four verdicts, ranked on the
// derivation-stage ladder against the board's own status names. Absent that config, every
// path below behaves exactly as described above.

import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { deriveSpecState, STATUS, STAGE, STAGES } from "../lib/spec-derive.mjs";
import { hasAnyChild, findRootsDownwards } from "../lib/project-root.mjs";
import { parseLinkedTask, findLinkedTasks, readMirror, providers, mirrorStaleness, parseDispatchRecords } from "../lib/board-mirror.mjs";

/**
 * Per-project bridge config: `.spec-bridge.json` at the project root (beside backlog/).
 * `{ "strictDone": true }` turns on analyze-gated Done (see lib/spec-derive.mjs);
 * `"statusVocabulary"` opts the board into phase-level status names (see
 * vocabularyProfile below). Missing or malformed config means checkbox-only mode with the
 * 3-status vocabulary — everything finer is opt-in.
 */
export function loadBridgeConfig(root) {
  try { return JSON.parse(readFileSync(join(root, ".spec-bridge.json"), "utf8")) ?? {}; }
  catch { return {}; }
}

/**
 * What each derivation stage is called on a board that has NOT renamed it. This is exactly
 * the 3-status collapse ("reviewing" is named Done because the sync skill's only move from
 * there is `-s Done`), which is why a statusVocabulary that renames nothing behaves
 * bit-for-bit like no statusVocabulary at all.
 */
export const DEFAULT_STAGE_NAMES = {
  [STAGE.SPECIFYING]: "To Do",
  [STAGE.PLANNING]: "In Progress",
  [STAGE.IMPLEMENTING]: "In Progress",
  [STAGE.VALIDATING]: "In Progress",
  [STAGE.REVIEWING]: "Done",
};

/**
 * The opt-in phase-level vocabulary, normalized. `.spec-bridge.json` may carry
 *   { "statusVocabulary": { "<stage>": "<board status name>", ... } }
 * mapping any of the derivation stages (specifying / planning / implementing / validating /
 * reviewing) to the consumer board's own status names; unmapped stages keep their
 * DEFAULT_STAGE_NAMES. Returns null — 3-status behavior, unchanged — unless at least one
 * stage is validly renamed (string values only; unknown keys ignored).
 *
 * The profile carries:
 *   names — stage → board status name (defaults overlaid with the config)
 *   cover — lowercase board status name → { min, max } span of stage ranks it stands for
 *           (a name used for several stages honestly covers all of them; "Done" always
 *           covers at least the top stage, so Done-eligibility is unchanged by opting in)
 */
export function vocabularyProfile(config) {
  const raw = config?.statusVocabulary;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const names = { ...DEFAULT_STAGE_NAMES };
  let renamed = false;
  for (const key of STAGES) {
    if (typeof raw[key] === "string" && raw[key].trim()) { names[key] = raw[key].trim(); renamed = true; }
  }
  if (!renamed) return null;
  const top = STAGES.length - 1;
  const cover = new Map([["done", { min: top, max: top }]]);
  STAGES.forEach((stageKey, rank) => {
    const name = names[stageKey].toLowerCase();
    const c = cover.get(name);
    if (!c) cover.set(name, { min: rank, max: rank });
    else { c.min = Math.min(c.min, rank); c.max = Math.max(c.max, rank); }
  });
  return { names, cover };
}

/**
 * The opt-in project-gate declaration, normalized. `.spec-bridge.json` may carry
 *   { "projectGates": {
 *       "required":          [ { "name": "tests",     "command": ["node", "--test"] } ],
 *       "redByConstruction": [ { "name": "freshness", "command": ["node", "grounding-wiki/gates/cli.mjs", "freshness", ".", "docs/wiki"] } ]
 *   } }
 * declaring which host gates must be green before a linked spec may be Done-eligible
 * (`required`) and which a mid-PR phase MAY leave red — the freshness gate between a
 * source edit and its re-pin commit (`redByConstruction`). "Red until the re-pin commit"
 * is not a property this checker can see, so the host STATES it; it is data the check
 * reads, never prose (spec 050 R1).
 *
 * This mirrors vocabularyProfile exactly: returns null — behavior bit-for-bit unchanged,
 * every existing message and plan byte-identical — unless at least one validly-shaped gate
 * entry exists. A valid entry is `{ name: <non-empty string>, command: <non-empty array of
 * non-empty strings> }`; malformed entries are dropped silently (unknown keys / bad values
 * ignored, never guessed), and if nothing valid survives in either bucket the whole opt-in
 * is null. `command` is an argv array by design (never a shell string): declared commands
 * run via spawnSync with shell:false, so there is no interpolation and no injection surface
 * (spec 050 R4; the exec itself lands in phase 2). The field case this guards: 2026-08-01,
 * spec 048 phases 1-2, "254 pass, 0 fail" reported and a tasks.md box ticked while four wiki
 * notes were staled and the freshness gate was red.
 *
 * Returns { required, redByConstruction } — each an array of { name, command } with command
 * a string[] argv; an absent-but-other-present bucket is []. Null iff no valid entry at all.
 */
export function projectGatesProfile(config) {
  const raw = config?.projectGates;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const parseBucket = (value) => {
    if (!Array.isArray(value)) return [];
    const out = [];
    for (const entry of value) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      // A validly-shaped entry needs a name AND an argv that is a non-empty array of
      // non-empty strings. A string `command` is NOT accepted — no safe split exists, and
      // the whole point is to never touch a shell. A malformed element (empty/non-string)
      // fails the whole entry rather than being silently repaired; drop it, never guess.
      const cmd = entry.command;
      const argvOk = Array.isArray(cmd) && cmd.length > 0 && cmd.every((a) => typeof a === "string" && a.trim());
      if (!name || !argvOk) continue;
      out.push({ name, command: cmd });
    }
    return out;
  };
  const required = parseBucket(raw.required);
  const redByConstruction = parseBucket(raw.redByConstruction);
  if (required.length === 0 && redByConstruction.length === 0) return null;
  return { required, redByConstruction };
}

/* ── project gates: running the declared commands and turning red into findings ────────────
 *
 * spec 050. The field case this exists to stop: 2026-08-01, spec 048 phases 1-2, a dispatched
 * implementer reported "node --test — 254 pass, 0 fail" and ticked its tasks.md box while four
 * wiki notes were staled and the freshness gate was red; the next phase re-ran the suite and
 * found 258/259. A ticked tasks.md checkbox IS status, and a status can never exceed the
 * artifacts that prove it — so a ticked box standing over a red project gate blocks.
 *
 * One pure evaluator (evaluateProjectGates), two entry points that differ only in WHEN and
 * WHICH buckets they run: the Stop hook (checkBridge) fires only at Done-eligible; the CLI
 * `verify` verb (verifyBridge) covers the mid-PR case. Command execution is injected so tests
 * drive every branch — green, red, spawn-failure, timeout — without a subprocess. */

/** Per-command wall-clock ceiling. `node --test` here is ~5.7s (spec 050 R4, measured); 2 min is
 *  ample headroom while still boxing a hung gate so it cannot wedge every Stop (fail-closed). */
export const GATE_TIMEOUT_MS = 120000;

/**
 * Run ONE declared gate command as a subprocess and classify the outcome. argv only, shell:false
 * (no interpolation, no injection surface — spec 050 R4); cwd is the project root. Returns
 *   { ok: true }                          — exit 0, green
 *   { ok: false, kind: "red", reason }    — nonzero exit / killed by signal
 *   { ok: false, kind: "error", reason }  — could not execute at all (ENOENT, spawn error)
 *   { ok: false, kind: "timeout", timeoutMs } — exceeded the time box
 * "error" and "timeout" are the fail-closed cases: a command that cannot run is NEVER green (it
 * is the gate-runner contract applied one level down — a crash is a blocking problem, not a
 * silent pass). Sets SPEC_BRIDGE_GATE_ACTIVE on the child env so a declared command that itself
 * invokes the bridge short-circuits instead of recursing (see checkBridge/verifyBridge).
 *
 * `trace` (spec 061 R4) is an optional callback invoked with the RAW outcome — { command, cwd,
 * status, signal, stdout, stderr, error } — before it's classified into the shape above. It
 * exists solely for opt-in instrumentation (see `bridgeGate.check`); omitted (the default for
 * every existing caller and every test), it costs one falsy check, never a syscall. A throwing
 * `trace` is swallowed here too — instrumentation must never affect this function's verdict.
 */
export function runGateCommand(command, { cwd, timeoutMs = GATE_TIMEOUT_MS, spawn = spawnSync, trace } = {}) {
  let res;
  try {
    res = spawn(command[0], command.slice(1), {
      cwd, timeout: timeoutMs, shell: false, encoding: "utf8",
      env: { ...process.env, SPEC_BRIDGE_GATE_ACTIVE: "1" },
    });
  } catch (e) {
    if (trace) try { trace({ command, cwd, status: null, signal: null, stdout: "", stderr: "", error: e.code || e.message }); } catch { /* swallowed */ }
    return { ok: false, kind: "error", reason: e.code || e.message };
  }
  if (trace) {
    try {
      trace({
        command, cwd,
        status: res.status ?? null, signal: res.signal ?? null,
        stdout: res.stdout || "", stderr: res.stderr || "",
        error: res.error ? (res.error.code || res.error.message) : null,
      });
    } catch { /* swallowed: instrumentation must never affect the verdict */ }
  }
  if (res.error) {
    if (res.error.code === "ETIMEDOUT") return { ok: false, kind: "timeout", timeoutMs };
    return { ok: false, kind: "error", reason: res.error.code || res.error.message };
  }
  if (res.status === 0) return { ok: true };
  if (res.status == null) return { ok: false, kind: "red", reason: res.signal ? `killed by ${res.signal}` : "no exit status" };
  return { ok: false, kind: "red", reason: `exited ${res.status}` };
}

/**
 * Whether <root>'s working tree has uncommitted changes (spec 061 R2), via `git status
 * --porcelain` — non-empty stdout = dirty. **Fail closed**: any failure to determine (nonzero
 * exit, spawn error, git absent) => `false` (treated clean, gate keeps blocking) — an
 * undeterminable condition must never silently disarm the gate, the same posture
 * `runGateCommand` takes for a command that cannot run. Argv only, shell:false, cwd = root —
 * this reads the same tree a gate command would run against, never the CWD it happened to be
 * invoked from.
 */
export function isTreeDirty(root, { spawn = spawnSync } = {}) {
  let res;
  try {
    res = spawn("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8", shell: false });
  } catch {
    return false;
  }
  if (res.error || res.status !== 0) return false;
  return typeof res.stdout === "string" && res.stdout.trim().length > 0;
}

/**
 * Clause appended to a collapsed gate finding sampled against a dirty tree (spec 061 R2): the
 * mirror image of this repo's own F6 finding ("a gate run against a dirty working tree proves
 * nothing about the commit"), recorded there for false greens and here producing false reds.
 * Rounds 1/2/4 of this repo's own fan-out chase were exactly this — an implementer's
 * uncommitted mid-dispatch edits, sampled and misread as a broken commit. The verdict is not
 * dropped (silence would hide a genuine red) but it must not block.
 */
const DIRTY_TREE_CLAUSE =
  " This verdict was sampled against a DIRTY working tree, not a commit — it proves nothing " +
  "about the commit and must not block. Commit or stash the tree, then re-run for a real verdict.";

/* ── R4 instrumentation: opt-in record of what a Stop invocation actually saw ────────────────
 *
 * Rounds 5-7 of this repo's own fan-out chase were unreproduced (see the card's elimination
 * list). Round 7's candidate mechanism — an orphaned worktree tree resolving as a SECOND root —
 * can only be settled by seeing, from a real Stop invocation, exactly which roots resolveRoots
 * returned and what each gate command actually did. This is that instrumentation:
 *
 *   - OFF by default: `SPEC_BRIDGE_GATE_TRACE` unset ⇒ `tracePath()` returns null ⇒ every call
 *     site below is a single falsy check, never a write, never a spawn.
 *   - Append-only JSONL, OUTSIDE the tracked tree: `$CLAUDE_JOB_DIR` if set (this repo's own
 *     scratch convention), else the OS temp dir — never inside the repo, or a Stop hook writing
 *     it would dirty the very tree Phase 2's dirty-tree check reads.
 *   - Verdict-neutral: every write is wrapped in try/catch. A trace failure is swallowed and
 *     can never turn a green gate red or vice versa.
 *
 * Wired ONLY into `bridgeGate.check` (the real Stop-hook path) — not into `checkBridge` callers
 * generally and not into `verifyBridge` — because R4 is about diagnosing Stop-time firings, and
 * an injected `run` (every test) never touches `runGateCommand`, so tests are unaffected whether
 * or not the env var happens to be set.
 */

/** Truthy env var → the JSONL path to append to. `"1"`/`"true"` mean "use the default scratch
 *  location"; any other value is used as an explicit path override. Unset ⇒ null (off). */
function tracePath() {
  const v = process.env.SPEC_BRIDGE_GATE_TRACE;
  if (!v) return null;
  if (v === "1" || v === "true") return join(process.env.CLAUDE_JOB_DIR || tmpdir(), "spec-bridge-gate-trace.jsonl");
  return v;
}

const TRACE_CAP = 4000; // bound stdout/stderr — the `tests` gate's own output is large

/** Bound a captured stream to TRACE_CAP chars, noting how much was cut. */
function capTrace(s) {
  if (typeof s !== "string" || s.length <= TRACE_CAP) return s;
  return s.slice(0, TRACE_CAP) + `…[${s.length - TRACE_CAP} more bytes truncated]`;
}

/** Append one JSONL record for this bridgeGate.check() invocation. Never throws — a write
 *  failure (unwritable path, ENOENT, disk full) is swallowed, never affecting the gate verdict. */
function traceGateRun(root, roots, commandRecords) {
  const path = tracePath();
  if (!path) return;
  try {
    const record = {
      ts: new Date().toISOString(),
      root,
      roots,
      commands: commandRecords.map((r) => ({ ...r, stdout: capTrace(r.stdout), stderr: capTrace(r.stderr) })),
    };
    appendFileSync(path, JSON.stringify(record) + "\n");
  } catch { /* verdict-neutral: instrumentation failure is swallowed */ }
}

/** The last ticked box in document order — the tick that (in sequence) claimed the most, and so
 *  the box a red gate most directly stands over. Null when nothing is ticked. */
function lastTickedBox(phaseBoxes) {
  let witness = null;
  for (const p of phaseBoxes || [])
    for (const b of p.boxes || [])
      if (b.checked) witness = { phase: p.name, box: b.text };
  return witness;
}

/** Flatten a profile into the ordered { name, command, bucket } gates for the named buckets. */
function gatesFor(profile, buckets) {
  const out = [];
  for (const bucket of buckets)
    for (const g of profile[bucket] || []) out.push({ ...g, bucket });
  return out;
}

/**
 * Memoize a gate runner by its argv so each DISTINCT declared command runs at most once per
 * bridge invocation. Declared gates are project-wide, not per-spec — the same `node --test` is
 * the `tests` gate for every linked spec — so its RESULT is computed once and shared across all
 * of them (spec 050 defect 2, Phase 5). Findings are still built per spec (each names its own
 * phase/box/gate); only the gate result is shared, never the finding. Before this, checkBridge
 * ran the full gate set once per Done-eligible spec — 49× on this repo's own board, ~358s — which
 * defeated R4's cost argument the moment more than one spec was Done-eligible.
 */
function memoizeRun(rawRun) {
  const cache = new Map();
  return (command) => {
    const key = command.join(" ");
    if (!cache.has(key)) cache.set(key, rawRun(command));
    return cache.get(key);
  };
}

/** The human clause for why a gate isn't green — honest about red vs. couldn't-run vs. timed-out. */
function gateReason(result) {
  if (result.kind === "timeout") return `timed out after ${result.timeoutMs}ms and is treated as failed, never green`;
  if (result.kind === "error") return `could not be executed (${result.reason}) and is treated as failed, never green`;
  return `is red (${result.reason})`;
}

/** Shared tail clause for every project-gate finding, per-spec or collapsed alike. */
const CANT_OUTRUN = "A ticked tasks.md checkbox cannot outrun a red project gate — make the gate pass or set the box back.";

/** The blocking finding: names the phase, the box, and the failing gate (spec 050 AC #1). */
function projectGateProblem({ id, specDir, witness, gate, result }) {
  const where = witness
    ? `phase "${witness.phase}", box "${witness.box}" is ticked, but `
    : "a ticked box stands over a gate that ";
  const label = gate.bucket === "redByConstruction" ? "red-by-construction gate" : "required gate";
  return `[spec-bridge] ${id} · ${specDir}: ${where}the ${label} "${gate.name}" ${gateReason(result)}. ${CANT_OUTRUN}`;
}

/**
 * Pure evaluator (spec 050): run the given gates for ONE linked spec, return one blocking finding
 * per gate that is not green. `link` is { id, specDir, phaseBoxes }; `gates` the ordered flattened
 * gate list (the caller picks the buckets — the two entry points differ there); `run` executes one
 * command and returns runGateCommand's shape (injected so tests need no subprocess). The witness box
 * is computed once from phaseBoxes so every finding names it.
 *
 * NOTE (spec 061 R1): `checkBridge`/`verifyBridge` no longer call this directly — one red project
 * gate now yields ONE collapsed finding per invocation naming the gate and the affected count
 * (see `collapsedGateProblems` below), not one finding per linked spec. This function remains the
 * pure per-spec evaluator: exported for direct testing of the per-gate/per-spec decision logic,
 * and available to any caller that wants the per-spec witness view (e.g. `cli.mjs state <specDir>`).
 */
export function evaluateProjectGates({ id, specDir, phaseBoxes }, gates, run) {
  const witness = lastTickedBox(phaseBoxes);
  const problems = [];
  for (const gate of gates) {
    const result = run(gate.command);
    if (result.ok) continue;
    problems.push(projectGateProblem({ id, specDir, witness, gate, result }));
  }
  return problems;
}

/**
 * Collapsed evaluator (spec 061 R1): run each distinct gate ONCE (via the memoized `runOne`) and
 * return at most one finding per non-green gate, naming the gate + bucket + `gateReason` + how
 * many qualifying specs are affected — never enumerating them. `counts` is `{ required,
 * redByConstruction }`, the number of specs the caller has already determined are held to each
 * bucket (checkBridge: every Done-eligible spec, held to both; verifyBridge: every ticked spec
 * for `required`, only the Done-eligible ones for `redByConstruction` — the bucket asymmetry).
 * A gate whose bucket count is 0 is never even run — no spec is holding it, so nothing changes
 * about WHICH gates run for WHICH specs, only how a non-green one is reported.
 */
function collapsedGateProblems(gates, counts, runOne) {
  const problems = [];
  for (const gate of gates) {
    const count = counts[gate.bucket] ?? 0;
    if (count === 0) continue;
    const result = runOne(gate.command);
    if (result.ok) continue;
    const label = gate.bucket === "redByConstruction" ? "red-by-construction gate" : "required gate";
    problems.push(
      `[spec-bridge] the ${label} "${gate.name}" ${gateReason(result)} — ${count} linked spec${count === 1 ? "" : "s"} affected. ${CANT_OUTRUN}`
    );
  }
  return problems;
}

/* ── the dispatch record and its fail-closed check (spec 066 R3) ───────────────────────────
 *
 * THE RULE: a task's PR is not merge-ready until its board card carries a dispatch record
 * naming the model that ACTUALLY SERVED. No record, no merge.
 *
 * WHY IT HAS TO BE A GATE AND NOT PROSE. An inline-implemented task leaves artifacts
 * *identical* to a dispatched one — same commits, same spec dir, same ticked boxes. The
 * served-model record is the ONLY residue that tells them apart. `tiers.mjs --check` proves a
 * generated agent definition matches the config; it cannot observe whether a dispatch
 * happened at all, nor whether the pin it verified is the model that ran. Field case:
 * 2026-09-10, Lane 4 of the TASK-108 sweep ran an entire task inline on the orchestrator's
 * Opus session while three written sources said to dispatch — none reached the session that
 * mattered, and no gate could catch it (`docs/design/lane-4-dispatch-gap.md`). Same defect
 * shape as a stale planted block (spec 066 R7c): written doctrine, no residue anything
 * enforces — different artifacts, so deliberately different mechanisms.
 *
 * THE MARKER, specified in `pdlc/templates/CLAUDE.md`'s `## Model tiers` section and
 * `pdlc/skills/sweep/templates/lane-handoff.md`'s `## Dispatch` section, so producer and
 * consumer read one spelling:
 *
 *   Dispatch: tier=<tier> pinned=<model-id> served=<model-id>
 *
 * One line per dispatch, anywhere in the card's text; a phase-dispatched task carries several.
 * `served=` is the load-bearing field and the only one this check requires — it is the fact
 * the whole rule exists to make checkable. A placeholder (`TBD`, `TO BE FILLED`, `pending`,
 * `unknown`, `?`) is NOT a served model: the record is written at dispatch time with that
 * field deliberately open, and filling it from the transcript is exactly the step being
 * enforced. Accepting the placeholder would make the gate satisfiable without ever reading a
 * transcript — the "name the tier, then work inline" failure one level up.
 *
 * WHY THIS LIVES IN spec-bridge AND NOT pdlc. `pdlc` owns the lifecycle verbs and the
 * doctrine that MANDATES the record; `spec-bridge` owns the gate that READS board cards. The
 * record lives on a card `checkBridge` already walks, parsed by a parser it already calls
 * (spec 066 finding F3) — so the check belongs to the reader, and no new gate script or
 * surface exists. A future reader will ask why a "dispatch" check is not in `pdlc`: this is
 * the answer.
 */

/** Values that mean "not filled in yet" — a record carrying one is treated as naming no served
 *  model at all. Compared case-insensitively with spacing/punctuation folded. */
const SERVED_PLACEHOLDERS = new Set([
  "", "?", "tbd", "tobefilled", "tofill", "pending", "unknown", "none", "na", "xxx", "todo",
]);

/**
 * Judge ONE `Dispatch:` payload (the text after the marker). Returns the served model when the
 * record names a real one, else null. Pure; exported for direct testing.
 */
export function servedModel(payload) {
  // The value runs to end-of-line, a `,`/`;`, or the next `key=` token — NOT to the first
  // space, then must be a SINGLE TOKEN. Two measured leaks drove that:
  //   `served=TO BE FILLED`             — stopping at the space captured "TO", not a
  //                                       placeholder, so the gate passed a card whose field
  //                                       was openly unfilled (this task's own card, no less).
  //   `served=claude-opus-5 (37 occurrences)` — trailing prose smuggled into the value.
  // A model ID never contains whitespace, so "has a space" settles both without an
  // ever-growing placeholder list: the writer must record a bare ID, which is also what makes
  // the value comparable to a tier config should anyone ever want that.
  const m = String(payload ?? "").match(/(?:^|[\s,;])served=\s*(.*?)\s*(?=[,;]|\s+[A-Za-z][\w-]*=|$)/i);
  if (!m) return null;
  const raw = m[1].replace(/^['"]|['"]$/g, "").trim();
  if (/\s/.test(raw)) return null;
  if (SERVED_PLACEHOLDERS.has(raw.toLowerCase().replace(/[_.-]/g, ""))) return null;
  return raw || null;
}

/**
 * Whether this linked card is IN SCOPE for the dispatch-record rule.
 *
 * SCOPING — the part that needed judgment, so here is the whole reasoning.
 *
 * `checkBridge` walks every linked card (63 in this repo) on every Stop, every
 * pre-commit/pre-push, and in CI. A blanket "every linked card must carry a record" would
 * fail ~62 historical cards the moment it shipped, and the tempting fix would be to weaken
 * the rule — precisely the failure mode this spec exists to stop. So the scope narrows twice,
 * deliberately:
 *
 * 1. **The host must OPT IN** — `"requireDispatchRecord": true` in `.spec-bridge.json`.
 *    `checkBridge` ships to consumers as `@praxisflux/gates`; a repo that has never heard of
 *    PDLC tiering must not acquire a blocking finding from a version bump. Absent the flag
 *    this check does not merely stay quiet, it does not run, and every existing verdict and
 *    message is bit-for-bit unchanged — the same opt-in posture `statusVocabulary` and
 *    `projectGates` take. Data the host STATES, never prose this checker infers.
 *
 * 2. **Only cards whose PR is still in flight** — i.e. not Done. The rule's own words are
 *    "not merge-ready", and merge-readiness is a property of work that has not merged. A Done
 *    card's PR merged long ago; demanding a record of it now IS the retrofit spec 066 puts
 *    out of scope, and a gate that retroactively condemns finished work gets disabled rather
 *    than obeyed. Zero historical cards are flagged BY CONSTRUCTION, not by a cutoff date
 *    someone picked — a claim that ages out on its own as work lands.
 *
 * WHAT THIS DOES NOT CATCH — stated plainly, because an honest narrow gate beats a broad one
 * that has to be softened later:
 *
 * - **A card that reaches Done without ever carrying a record.** Once Done it leaves scope
 *   permanently. Less a loophole than a race: the gate fires on every Stop, commit, push and
 *   CI run for the whole life of the claim, so escaping needs claim → implement → tick → Done
 *   with not one of those firing (the claim commit alone trips it). It IS a hole; closing it
 *   would mean holding merged history to a rule that did not exist when it merged.
 * - **A truthful-looking record for a dispatch that never happened.** Nothing here can reach
 *   a transcript: `served=cc/claude-sonnet-5` typed by a session that did the work itself is
 *   indistinguishable from the real thing. This raises the cost of a skipped dispatch from
 *   *invisible* to *a written falsehood on a tracked artifact*; it does not make it
 *   impossible. That is the ceiling of any board-side check, and worth having anyway.
 * - **Whether the served model matches the tier assigned.** `served=` is checked for presence
 *   and non-placeholder-ness, never against `.claude/model-tiers.json`. Cross-checking needs
 *   the config and the card to agree on spelling per host, and the pinned form is
 *   deliberately host-specific (see the planted block's Model tiers section).
 * - **How many dispatches happened.** One valid record anywhere on the card satisfies this.
 *   A phase-dispatched task SHOULD carry one per phase and the sweep skill says so, but a
 *   card's phase list can grow after the fact, so the count is not mechanically checkable.
 * - **Cards with no `Spec:` marker.** This gate only ever sees linked cards.
 *
 * ponytail: scope is derived from status, so it needs no new board field and no date. If a
 * host ever must hold merged cards to the rule, the upgrade is a declared epoch in
 * `.spec-bridge.json` (a date, or a spec-dir floor) rather than widening this predicate —
 * add it when someone actually has that need.
 */
export function dispatchRecordRequired(task) {
  return String(task?.status ?? "").toLowerCase() !== "done";
}

/** The blocking finding: names the card, the missing artifact, the exact line to write, and
 *  where the format is specified — a failure line names its fix (docs/wiki/gates-convention.md). */
function dispatchRecordProblem(task, { placeholderOnly }) {
  const why = placeholderOnly
    ? "its dispatch record's `served=` is still a placeholder"
    : "it carries no dispatch record";
  return (
    `[spec-bridge] ${task.id} is "${task.status}" (PR in flight) but ${why} — its PR is not ` +
    "merge-ready. An inline-implemented task is indistinguishable from a dispatched one in its " +
    "commits, specs and ticks, so the served model is the only residue. Read the model that " +
    "ACTUALLY served from the dispatch transcript and record it on the card: " +
    `backlog task edit ${task.id} --comment 'Dispatch: tier=<tier> pinned=<model-id> served=<model-id>'` +
    " (format: the planted CLAUDE.md `## Model tiers` section)."
  );
}

const RANK = { "to do": 0, "in progress": 1, done: 2 };
const DERIVED_RANK = { [STATUS.TODO]: 0, [STATUS.IN_PROGRESS]: 1, [STATUS.DONE_ELIGIBLE]: 2 };

// parseLinkedTask / findLinkedTasks moved to lib/board-mirror.mjs (spec 052 phase 2) — the
// backlog projector's parser lives in the chassis now, imported above and re-exported here so
// every existing import site still resolves.
export { parseLinkedTask, findLinkedTasks, parseDispatchRecords };

/**
 * The one seam through which the bridge learns what's on the board (spec 053 R1). Resolution
 * order, MIRROR FIRST:
 *   1. `.board/links.json` present → its `links` (readMirror throws fail-closed on a
 *      malformed/unknown-schema mirror; that throw is left to propagate so gate-runner.mjs
 *      surfaces it as a blocking problem, never a silently empty board).
 *   2. No mirror, but backlog/tasks/ present → project it live via `providers.backlog.project`
 *      — the backward-compatibility path: a host that never adopts the mirror keeps working,
 *      byte-identically, forever.
 *   3. Neither → [].
 * Mirror-first is deliberate, not incidental: a host that HAS adopted the mirror must be
 * answered from that receipt, not from a live rescan of backlog/tasks/ — otherwise an adopted
 * mirror is never actually exercised by the bridge, and 052's `--check` drift detection would
 * be guarding a file nothing reads.
 */
export function boardLinks(root) {
  const mirror = readMirror(root);
  if (mirror) return mirror.links;
  if (existsSync(join(root, "backlog", "tasks"))) return providers.backlog.project(root);
  return [];
}

/**
 * `.board.json` (spec 054, not yet merged) declares which provider a host uses. Read
 * defensively — absent, unreadable, or malformed all collapse to `"backlog"` — so this spec
 * lands and tests before 054 merges: `"backlog"` is the one provider that has ever worked
 * without a mirror at all (boardLinks' live-projection fallback), so a host that predates
 * `.board.json` entirely is judged exactly as it always was.
 */
function declaredProvider(root) {
  try {
    const raw = JSON.parse(readFileSync(join(root, ".board.json"), "utf8"));
    return typeof raw?.provider === "string" && raw.provider ? raw.provider : "backlog";
  } catch {
    return "backlog";
  }
}

/** Compare a task's Backlog status to its derived status: "exceeds" | "lags" | "ok" | "unknown". */
export function verdict(taskStatus, derivedStatus) {
  const t = RANK[String(taskStatus).toLowerCase()];
  const d = DERIVED_RANK[derivedStatus];
  if (t === undefined || d === undefined) return "unknown";
  return t > d ? "exceeds" : t < d ? "lags" : "ok";
}

/**
 * The same comparison at phase grain, against an opted-in vocabulary profile: a board status
 * exceeds when even the EARLIEST stage it stands for is later than the derived stage, lags
 * when even the LATEST is earlier, is ok anywhere inside its span, and is unknown when the
 * status isn't in the vocabulary (custom workflow: don't guess) — verdict()'s semantics,
 * finer ruler.
 */
export function stageVerdict(taskStatus, derivedStage, profile) {
  const c = profile.cover.get(String(taskStatus).toLowerCase());
  const d = STAGES.indexOf(derivedStage);
  if (!c || d < 0) return "unknown";
  return c.min > d ? "exceeds" : c.max < d ? "lags" : "ok";
}

/** One human sentence on why a spec dir doesn't prove more than its derived status. */
function shortfall(root, specDir, derived) {
  const missing = ["spec.md", "plan.md"].filter((f) => !existsSync(join(root, specDir, f)));
  const parts = missing.map((f) => `${f} missing`);
  if (derived.tasksTotal === 0) parts.push("no tasks in tasks.md");
  else if (derived.tasksDone < derived.tasksTotal)
    parts.push(`${derived.tasksTotal - derived.tasksDone} of ${derived.tasksTotal} tasks unchecked (${derived.progressNote})`);
  if (derived.analysis?.required) {
    if (!derived.analysis.present)
      parts.push("analysis.md missing (strict Done: save the /speckit.analyze report into the spec dir)");
    else if (derived.analysis.criticals.length)
      parts.push(`unresolved CRITICAL finding(s) in analysis.md: ${derived.analysis.criticals.join(" | ")}`);
  }
  return parts.join(", ") || "artifacts incomplete";
}

/**
 * Judge every linked task under <root>. Returns:
 *   links    — [{ id, status, specDir, derived, verdict }]
 *   problems — blocking messages, one per "exceeds", plus one per non-green declared project
 *              gate (spec 061 R1) — UNLESS the tree is dirty, in which case that gate finding
 *              moves to `warnings`, labeled (spec 061 R2): a verdict sampled against an
 *              uncommitted tree proves nothing about the commit and must not block.
 *   warnings — non-blocking messages: one per "lags", plus any dirty-tree-labeled gate finding.
 * `isDirty(root)` (default `isTreeDirty`) is injectable for tests, same pattern as `run`.
 * `trace` (spec 061 R4, opt-in instrumentation): a callback forwarded to the DEFAULT gate
 * runner's `runGateCommand` calls only — an injected `run` (every test) never reaches it, so
 * tests are unaffected whether or not it's provided.
 *
 * `gateActive` (spec 061 Phase 3b, T027): the reentrancy signal itself, injectable with a real
 * default — `process.env.SPEC_BRIDGE_GATE_ACTIVE === "1"` — same shape as `run`/`isDirty`. Every
 * real caller (cli.mjs, bridgeGate's production wiring) leaves it at the default, so the actual
 * env is still what decides for them; only a caller that explicitly passes `gateActive: false`
 * (a test-owned invocation, e.g. `bridgeGate.check(root, { gateActive: false })`) can make this
 * DEFAULT runner execute gates while an ambient SPEC_BRIDGE_GATE_ACTIVE=1 is set. This is what
 * lets `bridgeGate` tests (below) stay honest when this repo's own dogfood `tests` gate — bare
 * `node --test` — runs the whole suite as a child of a real gate spawn: those tests opt out of
 * the flag explicitly; nothing else does, so real recursive spawning is stopped exactly as before.
 */
export function checkBridge(root, {
  runGates = true, run, isDirty = isTreeDirty, trace,
  gateActive = process.env.SPEC_BRIDGE_GATE_ACTIVE === "1",
} = {}) {
  const links = [];
  const problems = [];
  const warnings = [];
  const config = loadBridgeConfig(root);
  const requireAnalysis = config.strictDone === true;
  const profile = vocabularyProfile(config);
  const gatesProfile = projectGatesProfile(config);
  // spec 066 R3: opt-in, and strictly `=== true` — an absent, false, or non-boolean value
  // leaves this check unrun and every existing verdict byte-identical (see
  // `dispatchRecordRequired` for the full scoping rationale).
  const requireDispatch = config.requireDispatchRecord === true;

  // R3/R4 (spec 053 phase 2): fail-closed board-evidence findings. Computed once per call,
  // independent of any particular linked task — the finding is about whether evidence EXISTS
  // at all, not about a task's derived state. `readMirror` throws on a malformed/unknown-schema
  // mirror; that throw is left to propagate (boardLinks() below re-reads it for the same
  // reason) so gate-runner.mjs's evaluate() surfaces it as a blocking problem — never a
  // silently empty board (lib/gate-runner.mjs :52-54).
  const mirror = readMirror(root);
  if (mirror) {
    // R3: for a requiresSync:true provider (e.g. Jira) the mirror IS the evidence, so a stale
    // one blocks — name the reason AND the remedy so the reader never needs a second lookup.
    // For requiresSync:false (Backlog) a stale mirror is deliberately NOT blocking: boardLinks()
    // step 2's live backlog/tasks/ projection is preferred over the stale receipt, so the gate
    // recomputes instead of complaining. Same staleness fact, opposite consequence — this
    // asymmetry is R3's point, not an inconsistency to "fix" into symmetry.
    const providerInfo = providers[mirror.provider];
    const requiresSync = providerInfo ? providerInfo.requiresSync : true; // unknown name: fail closed
    if (requiresSync) {
      const { stale, reason } = mirrorStaleness(root, mirror);
      if (stale) {
        problems.push(
          `[spec-bridge] board mirror is stale (${reason}) — run the board:sync skill to refresh .board/links.json before claiming status.`
        );
      }
    }
  } else {
    // R4: no mirror at all. `.board.json` declares which provider the host uses (absence =
    // "backlog", the only provider that has ever worked mirror-less). A requiresSync provider
    // with no mirror has NO evidence for this gate to check — that is the fail-closed finding
    // this whole spec exists to add, never a silently empty board.
    const provider = declaredProvider(root);
    const providerInfo = providers[provider];
    const requiresSync = providerInfo ? providerInfo.requiresSync : true;
    if (requiresSync) {
      problems.push(
        `[spec-bridge] provider "${provider}" is declared but .board/links.json is missing — the gate has no board evidence to check. Run the board:sync skill.`
      );
    }
  }

  // Run declared project gates only when they're opted into and the caller asked for it (the Stop
  // hook runs them in `check` but not the duplicate `warn` pass). SPEC_BRIDGE_GATE_ACTIVE, set on
  // every child runGateCommand spawns, is the reentrancy guard: a host gate command that itself
  // re-invokes the bridge short-circuits instead of forking forever (spec 050 R4). But that guard
  // exists to stop the DEFAULT runner from spawning real subprocesses — an injected `run` is a
  // test double that spawns nothing, so it MUST bypass the guard (spec 050 defect 1, Phase 5).
  // Without this bypass the bridge's own dogfood reddens its `tests` gate: `node --test` runs the
  // Phase-3 suite with the flag set, and every injected-run test there fail-closes to [].
  const injected = run !== undefined;
  const execGates = runGates && !!gatesProfile && (injected || !gateActive);
  const runOne = memoizeRun(run || ((command) => runGateCommand(command, { cwd: root, trace })));
  let doneEligibleCount = 0; // spec 061 R1: gate findings collapse to one-per-gate after the loop
  for (const task of boardLinks(root)) {
    const derived = deriveSpecState(join(root, task.specDir), { requireAnalysis });
    // Opted-in boards are judged on the stage ladder against their own status names;
    // everyone else gets the 3-status comparison, untouched.
    const v = profile ? stageVerdict(task.status, derived.stage, profile) : verdict(task.status, derived.status);
    const proven = profile ? profile.names[derived.stage] : derived.status;
    links.push({ ...task, derived, verdict: v });
    if (v === "exceeds") {
      problems.push(
        `[spec-bridge] ${task.id} is "${task.status}" but ${task.specDir} only proves "${proven}": ` +
        `${shortfall(root, task.specDir, derived)}. Finish the spec work or set the task back (backlog task edit ${task.id} -s "...").`
      );
    } else if (v === "lags") {
      warnings.push(
        `[spec-bridge] ${task.id} is "${task.status}" but ${task.specDir} already derives "${proven}" — run the spec-bridge sync skill to catch the board up.`
      );
    } else if (
      // Strict-mode near-miss: the status is honest ("ok"), every checkbox is checked, and
      // the ONLY thing between this task and Done-eligible is the analysis requirement.
      // Without this notice the state is silent — Done is out of reach and nothing says so
      // until someone thinks to run `state`. Warn (the warn channel), never block.
      v === "ok" &&
      derived.analysis?.required &&
      derived.status !== STATUS.DONE_ELIGIBLE &&
      derived.tasksTotal > 0 &&
      derived.tasksDone === derived.tasksTotal &&
      existsSync(join(root, task.specDir, "plan.md"))
    ) {
      const a = derived.analysis;
      warnings.push(
        `[spec-bridge] ${task.id}: all ${derived.tasksTotal} spec tasks checked; Done blocked by strict mode: ` +
        (!a.present
          ? "analysis.md missing — run /speckit.analyze and save its report as " + `${task.specDir}/analysis.md`
          : `unresolved CRITICAL finding(s) in analysis.md: ${a.criticals.join(" | ")}`)
      );
    }

    // Dispatch-record check (spec 066 R3). Independent of the verdict above: a card can be
    // perfectly honest about its status and still have no proof its implementation was
    // dispatched. Blocks, because "not merge-ready" is a claim about work in flight and this
    // is the one artifact that separates a dispatched task from an inline-implemented one.
    if (requireDispatch && dispatchRecordRequired(task)) {
      const records = task.dispatches ?? [];
      if (!records.some((r) => servedModel(r))) {
        problems.push(dispatchRecordProblem(task, { placeholderOnly: records.length > 0 }));
      }
    }

    // Project-gate check (spec 050 R4): a spec is held to its declared gates ONLY when
    // Done-eligible — the one bounded moment a red gate under a ticked box changes an outcome,
    // so ordinary turns pay zero subprocess cost. At Done-eligible the mid-PR window has closed
    // (every box, including the re-pin box, is ticked), so BOTH buckets must be green: required,
    // AND redByConstruction — its "allowed red mid-PR" license has expired now that its re-pin
    // was claimed done. Tally the count here; the gates themselves run once, after the loop
    // (spec 061 R1: one finding per red gate, not one per linked spec).
    if (execGates && derived.status === STATUS.DONE_ELIGIBLE) doneEligibleCount++;
  }
  if (doneEligibleCount > 0) {
    const gates = gatesFor(gatesProfile, ["required", "redByConstruction"]);
    const counts = { required: doneEligibleCount, redByConstruction: doneEligibleCount };
    const found = collapsedGateProblems(gates, counts, runOne);
    if (found.length > 0) {
      // spec 061 R2: dirtiness is computed ONCE per invocation (T009) — only reached at all
      // when there is at least one non-green gate to label. A dirty tree routes the finding
      // into `warnings` (non-blocking, labeled); clean or undeterminable (fail-closed) keeps
      // it in `problems`, unchanged from today.
      if (isDirty(root)) warnings.push(...found.map((p) => p + DIRTY_TREE_CLAUSE));
      else problems.push(...found);
    }
  }
  return { links, problems, warnings };
}

/**
 * The `verify` entry point (spec 050 R4): the mid-PR counterpart to the Stop hook. For every
 * linked spec that has at least one ticked box — a box claiming greenness — run the declared
 * gates and return the blocking findings. A Done-eligible spec is held to BOTH buckets (as the
 * Stop hook does); a mid-PR spec to `required` only, because redByConstruction gates are
 * legitimately red between a source edit and its re-pin commit. Shares collapsedGateProblems
 * (spec 061 R1), so it and the Stop hook agree by construction. Read-only like the rest of
 * gates/: it runs the host's declared subprocesses but writes nothing itself. Injectable `run`
 * for tests.
 *
 * Returns `{ problems, warnings }` (spec 061 T018a — this used to be a flat `problems` array;
 * `verify` is the mid-PR entry point, exactly the window where a working tree is dirtiest, so
 * R2's "a non-green project gate must not block on a dirty-tree sample" applies here too, not
 * only to `checkBridge`. A dirty-tree gate finding is never dropped — it moves to `warnings`,
 * still labeled, never silently disappearing. `isDirty(root)` (default `isTreeDirty`) is
 * injectable, same pattern as `checkBridge`.
 */
export function verifyBridge(root, { run, isDirty = isTreeDirty } = {}) {
  const config = loadBridgeConfig(root);
  const gatesProfile = projectGatesProfile(config);
  if (!gatesProfile) return { problems: [], warnings: [] }; // no opt-in → nothing to do
  // Reentrancy guard (spec 050 defect 1, Phase 5): a spawned gate command that re-invokes the
  // bridge with the DEFAULT runner short-circuits so it can't fork forever; an injected `run` is
  // a test double that spawns nothing, so it bypasses the guard.
  const injected = run !== undefined;
  if (!injected && process.env.SPEC_BRIDGE_GATE_ACTIVE === "1") return { problems: [], warnings: [] };
  const requireAnalysis = config.strictDone === true;
  // Share each distinct gate result across every spec this invocation checks (spec 050 defect 2).
  const runOne = memoizeRun(run || ((command) => runGateCommand(command, { cwd: root })));
  // Tally counts per bucket (spec 061 R1/R4): `required` covers every ticked spec; `redByConstruction`
  // only the ticked specs that are ALSO Done-eligible — the bucket asymmetry, preserved exactly as
  // before (which gates run for which specs is unchanged; only the reporting collapses).
  const counts = { required: 0, redByConstruction: 0 };
  for (const task of boardLinks(root)) {
    const derived = deriveSpecState(join(root, task.specDir), { requireAnalysis });
    const anyTicked = (derived.phaseBoxes || []).some((p) => (p.boxes || []).some((b) => b.checked));
    if (!anyTicked) continue; // nothing claims greenness yet — no tick to outrun a gate
    counts.required += 1;
    if (derived.status === STATUS.DONE_ELIGIBLE) counts.redByConstruction += 1;
  }
  const gates = gatesFor(gatesProfile, ["required", "redByConstruction"]);
  const found = collapsedGateProblems(gates, counts, runOne);
  if (found.length === 0) return { problems: [], warnings: [] };
  // spec 061 T018a: same dirty-tree routing as checkBridge — labeled and non-blocking, never
  // silently dropped. Computed only once found.length > 0, matching checkBridge's shape.
  if (isDirty(root)) return { problems: [], warnings: found.map((p) => p + DIRTY_TREE_CLAUSE) };
  return { problems: found, warnings: [] };
}

/* ── plan: reconciliation intents, and the Backlog renderer for them ───── */

const PHASE_PREFIX = "Spec phase: ";

/** Single-quote a string for verbatim shell use. */
const sq = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

/**
 * Pure reconciliation for ONE linked task (spec 053 R5): the board-neutral INTENT that would
 * bring it in line with its derived state — decided here, rendered nowhere. ALL the ordering
 * logic lives here, not in a renderer: stale phase-AC removals highest-index-first (so
 * earlier indexes stay valid while they're being removed), check/uncheck computed at
 * POST-EDIT indexes (after removals and additions have already renumbered the list). That
 * ordering is load-bearing and hard-won — it is reconciliation, not rendering, which is
 * exactly why the split puts it on this side of the line. ACs that don't start with
 * "Spec phase: " are human-authored and are never touched.
 *
 * Shape (spec 053 R5's minimum, so a future provider's renderer has something to render):
 *   { id, statusFrom, statusTo, finalSummary, acRemove, acAdd, acCheck, acUncheck, note }
 * `statusTo` / `finalSummary` / `note` are null when nothing moves on that axis.
 *
 * With an opted-in vocabulary profile (third argument), status targets are the profile's
 * stage names instead of the 3-status collapse. Done keeps its meaning: a board that leaves
 * "reviewing" at its default still resolves `statusTo: "Done"` with the derived final
 * summary; a board that names it (say "In Review") resolves to that name, and moving to Done
 * stays a human/consumer act the gate already accepts (Done never exceeds a fully-proven spec).
 */
export function planIntents(task, derived, profile = null) {
  // Status — Done-eligible is the only path to Done and carries the derived final summary.
  const mapped = profile ? profile.names[derived.stage] : null;
  const target = derived.status === STATUS.DONE_ELIGIBLE
    ? (mapped && mapped.toLowerCase() !== "done" ? mapped : "Done")
    : (mapped ?? derived.status);
  const statusChanged = String(task.status).toLowerCase() !== target.toLowerCase();

  // Phase-AC reconciliation. The bridge owns exactly the "Spec phase: " ACs.
  const phaseByName = new Map((derived.phases || []).map((p) => [p.name, p]));
  const seen = new Set();
  const removed = new Set();
  for (const a of task.acs || []) {
    if (!a.text.startsWith(PHASE_PREFIX)) continue;
    const name = a.text.slice(PHASE_PREFIX.length);
    if (!phaseByName.has(name) || seen.has(name)) removed.add(a.index); // stale or duplicate
    else seen.add(name);
  }
  const acRemove = [...removed].sort((a, z) => z - a); // highest index first, so earlier indexes stay valid

  const additions = (derived.phases || []).filter((p) => !seen.has(p.name));
  const acAdd = additions.map((p) => PHASE_PREFIX + p.name);

  // Post-edit indexes: survivors keep their relative order and renumber from 1; additions
  // append after them, unchecked. Check/uncheck against what each phase actually proves.
  const survivors = (task.acs || []).filter((a) => !removed.has(a.index));
  const finalList = [
    ...survivors.map((a) => ({ text: a.text, checked: a.checked })),
    ...additions.map((p) => ({ text: PHASE_PREFIX + p.name, checked: false })),
  ];
  const acCheck = [];
  const acUncheck = [];
  finalList.forEach((item, i) => {
    if (!item.text.startsWith(PHASE_PREFIX)) return; // human-authored: never touched
    const p = phaseByName.get(item.text.slice(PHASE_PREFIX.length));
    if (!p) return;
    const want = p.total > 0 && p.done === p.total;
    if (want && !item.checked) acCheck.push(i + 1);
    else if (!want && item.checked) acUncheck.push(i + 1);
  });

  // Nothing to note when nothing changed — no churn in the task history.
  const changed = statusChanged || acRemove.length > 0 || acAdd.length > 0 || acCheck.length > 0 || acUncheck.length > 0;
  const suffix = statusChanged ? ` — status ${task.status} → ${target}` : "";

  return {
    id: task.id,
    statusFrom: task.status,
    statusTo: statusChanged ? target : null,
    finalSummary: statusChanged && target === "Done"
      ? `All spec tasks complete (${derived.progressNote}). Derived Done by spec-bridge sync.`
      : null,
    acRemove, acAdd, acCheck, acUncheck,
    note: changed ? `spec-bridge sync: ${derived.progressNote}${suffix}` : null,
  };
}

/**
 * Render one task's intents as the exact `backlog task edit …` command strings — today's
 * literal bytes (spec 053 R5). Order: status move → AC removals → AC additions → check →
 * uncheck → one append-notes. `id` is taken as a parameter rather than read off `intents` so
 * a renderer never has to trust the blob it's handed.
 */
export function renderBacklog(id, intents) {
  const cmds = [];
  const edit = (args) => cmds.push(`backlog task edit ${id} ${args}`);
  if (intents.statusTo) {
    if (intents.statusTo === "Done") edit(`-s ${sq("Done")} --final-summary ${sq(intents.finalSummary)}`);
    else edit(`-s ${sq(intents.statusTo)}`);
  }
  for (const i of intents.acRemove) edit(`--remove-ac ${i}`);
  for (const text of intents.acAdd) edit(`--ac ${sq(text)}`);
  for (const i of intents.acCheck) edit(`--check-ac ${i}`);
  for (const i of intents.acUncheck) edit(`--uncheck-ac ${i}`);
  if (intents.note) edit(`--append-notes ${sq(intents.note)}`);
  return cmds;
}

/**
 * Render one task's intents as ordered Jira MCP call descriptions (spec 055 R6): `renderBacklog`'s
 * sibling for the `jira` provider. Each entry is `{ tool, args, why }` — `tool` a bare MCP tool
 * name, unprefixed (the connector-specific prefix these Atlassian tools carry, and the actual
 * dispatch, are spec 056's skill's job, not this module's), `args` a plain object, `why` the
 * human-legible reason (feeds the sync skill's progress note). PURE: no MCP call, no network, no
 * remote fetch of any kind — this is what keeps `lib/` (and this gate) network-free
 * (docs/design/board-provider-seam.md invariant 4).
 *
 * `config` is `.board.json`'s `jira` sub-object (spec 054); only `statusMap` is consulted.
 *
 * The AC-block collapse: the Backlog renderer above issues one command PER acRemove/acAdd/
 * acCheck/acUncheck entry, because Backlog's AC list has a partial-edit CLI. Jira's marked
 * description block (docs/board-verbs.md R2) has no partial-edit form — it is replaced
 * wholesale — so every ac* array here folds into exactly ONE `editJiraIssue` call, whatever the
 * mix of adds/removes/checks/unchecks. That call's `args` carries the RAW diff, not a
 * fully-resolved description string: resolving it against the block's CURRENT text needs the
 * live issue (read via `getJiraIssue`, parsed with `parseSpecPhasesBlock`, the diff applied,
 * re-rendered with `renderSpecPhasesBlock` — both `lib/board-mirror.mjs`), which needs live data
 * this pure function neither has nor is allowed to fetch. That resolution is spec 056's skill's
 * job — this function only describes the diff to make, in order; executing (and resolving) it
 * is not this module's job.
 */
export function renderJira(id, intents, config = {}) {
  const statusMap = config?.statusMap ?? {};
  const calls = [];

  if (intents.statusTo) {
    const target = statusMap[intents.statusTo] ?? intents.statusTo;
    if (intents.statusTo === "Done" && intents.finalSummary) {
      // board:final's jira column: comment the summary, THEN transition — so the summary is on
      // record before the issue moves, mirroring Backlog's combined `-s Done --final-summary`.
      calls.push({
        tool: "addOrEditJiraIssueComment",
        args: { issueIdOrKey: id, commentBody: intents.finalSummary },
        why: intents.finalSummary,
      });
    }
    calls.push({
      tool: "transitionJiraIssue",
      args: { issueIdOrKey: id, status: target },
      why: `status ${intents.statusFrom} -> ${intents.statusTo}`,
    });
  }

  const acChanged = intents.acRemove.length > 0 || intents.acAdd.length > 0
    || intents.acCheck.length > 0 || intents.acUncheck.length > 0;
  if (acChanged) {
    calls.push({
      tool: "editJiraIssue",
      args: {
        issueIdOrKey: id,
        acRemove: intents.acRemove, acAdd: intents.acAdd,
        acCheck: intents.acCheck, acUncheck: intents.acUncheck,
      },
      why: intents.note ?? "phase ACs reconciled",
    });
  }

  if (intents.note) {
    calls.push({
      tool: "addOrEditJiraIssueComment",
      args: { issueIdOrKey: id, commentBody: intents.note },
      why: intents.note,
    });
  }

  return calls;
}

/**
 * Backward-compatible single-shot planner: `planIntents` then `renderBacklog` in one call.
 * Every call site inside this module now goes through the two halves directly; this wrapper
 * exists only because it is still a public, imported symbol (spec 053 AC #9).
 */
export function planLinkedTask(task, derived, profile = null) {
  return renderBacklog(task.id, planIntents(task, derived, profile));
}

/**
 * Which provider `planBridge` renders for (spec 053 R5): the mirror's own declared provider
 * when a mirror is on disk (it's the artifact that exists, so it's the truth), `.board.json`'s
 * declaration otherwise — the same present-artifact split `checkBridge`'s R3/R4 block uses,
 * for the same reason: don't let a config file override live mirror evidence when both exist.
 */
function resolvedProvider(root) {
  const mirror = readMirror(root);
  return mirror ? mirror.provider : declaredProvider(root);
}

/**
 * Plan every linked task under <root>, in queue order (spec 053 R5). `skipped` — [{ id,
 * status }] for verdict-unknown tasks (custom status: don't guess) — is returned either way.
 * For the `backlog` provider: `{ commands, skipped }`, today's exact `backlog task edit`
 * strings, byte-identical to before the split (empty `commands` on a reconciled board is
 * still a no-op). For any other provider: `{ intents, skipped, notice }` — the same
 * reconciliation as structured intents, plus a notice that command rendering is
 * provider-specific (spec 055 owns that verb table; guessing it here would mean writing it
 * twice). Read-only like everything in gates/: plan computes edits, it never executes them.
 */
export function planBridge(root) {
  const skipped = [];
  const perTask = [];
  const config = loadBridgeConfig(root);
  const requireAnalysis = config.strictDone === true;
  const profile = vocabularyProfile(config);
  for (const task of boardLinks(root)) {
    const derived = deriveSpecState(join(root, task.specDir), { requireAnalysis });
    const v = profile ? stageVerdict(task.status, derived.stage, profile) : verdict(task.status, derived.status);
    if (v === "unknown") { skipped.push({ id: task.id, status: task.status }); continue; }
    perTask.push(planIntents(task, derived, profile));
  }
  if (resolvedProvider(root) === "backlog") {
    return { commands: perTask.flatMap((intents) => renderBacklog(intents.id, intents)), skipped };
  }
  return {
    intents: perTask,
    skipped,
    notice:
      "command rendering is provider-specific — \"backlog\" is the only rendered provider today " +
      "(spec 055 owns the verb table for the rest); these are structured intents, not commands.",
  };
}

// spec 061 R2/T011: `bridgeGate.warn` deliberately calls `checkBridge(root, { runGates: false })`
// so a Stop pays for the gate subprocesses once, not twice (the cost regression spec 050
// fixed). A dirty-tree gate warning is only knowable from the runGates:true pass, so `check`
// stashes it here, keyed by root, for `warn` to read-and-clear on the very next call for that
// same root (lib/gate-runner.mjs calls check(root) then warn(root) in that order, per root, in
// one evaluate() pass — see gate-runner.mjs's evaluate loop). No second gate run, ever.
const dirtyTreeGateWarningsByRoot = new Map();

// spec 061 R4: the full roots list from the MOST RECENT resolveRoots() call, read (not
// consumed) by check() so its trace record can show what resolveRoots returned this
// invocation — round 7's candidate mechanism (an orphaned worktree resolving as a second
// root) is only visible in that full list, not in the single root check() is handed.
let lastResolvedRootsForTrace = null;

/**
 * The Stop-hook gate, in gate-runner shape. Roots are directories holding a backlog/ dir;
 * a root with no linked tasks yields no problems, so the gate is a natural no-op outside
 * bridged projects. "exceeds" blocks; "lags" only warns.
 *
 * `check`/`warn` take an optional second arg beyond gate-runner's own `(root, ctx)` call —
 * gate-runner's `ctx` is always `{ sessionId, input }` (spec 061 Phase 3b: neither key is
 * named `gateActive`), so a real invocation's `opts.gateActive` is always `undefined` and
 * `checkBridge`'s own default (the real env read) decides, exactly as before. Only a test that
 * explicitly calls e.g. `bridgeGate.check(root, { gateActive: false })` can force the DEFAULT
 * runner to execute under an ambient SPEC_BRIDGE_GATE_ACTIVE=1 — see `checkBridge`'s `gateActive`
 * doc above for why that can't be reached by anything spawned as a real gate command.
 */
export const bridgeGate = {
  name: "spec-bridge",
  resolveRoots: (startDir) => {
    const roots = findRootsDownwards(startDir, hasAnyChild(".board", "backlog"));
    lastResolvedRootsForTrace = roots;
    return roots;
  },
  // The runner calls check() then warn() per root; run the (possibly costly) project-gate
  // commands only in check so a Stop pays for them once, not twice. Warnings never depend on
  // gate execution, so runGates:false loses nothing — except the dirty-tree gate label (spec
  // 061 R2), which check() computed for free as part of running the gates and stashes below.
  check: (root, opts = {}) => {
    const path = tracePath(); // spec 061 R4: null unless SPEC_BRIDGE_GATE_TRACE is set
    const commandRecords = path ? [] : null;
    const { problems, warnings } = checkBridge(root, {
      runGates: true,
      trace: commandRecords ? (rec) => commandRecords.push(rec) : undefined,
      gateActive: opts.gateActive,
    });
    dirtyTreeGateWarningsByRoot.set(root, warnings.filter((w) => w.includes(DIRTY_TREE_CLAUSE)));
    if (commandRecords) traceGateRun(root, lastResolvedRootsForTrace, commandRecords);
    return problems;
  },
  warn: (root, opts = {}) => {
    const stashed = dirtyTreeGateWarningsByRoot.get(root) || [];
    dirtyTreeGateWarningsByRoot.delete(root);
    return [...checkBridge(root, { runGates: false, gateActive: opts.gateActive }).warnings, ...stashed];
  },
};
