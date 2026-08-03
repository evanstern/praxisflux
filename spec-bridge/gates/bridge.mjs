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

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { deriveSpecState, STATUS, STAGE, STAGES } from "../lib/spec-derive.mjs";
import { hasChild, findRootsDownwards } from "../lib/project-root.mjs";

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
 */
export function runGateCommand(command, { cwd, timeoutMs = GATE_TIMEOUT_MS, spawn = spawnSync } = {}) {
  let res;
  try {
    res = spawn(command[0], command.slice(1), {
      cwd, timeout: timeoutMs, shell: false, encoding: "utf8",
      env: { ...process.env, SPEC_BRIDGE_GATE_ACTIVE: "1" },
    });
  } catch (e) {
    return { ok: false, kind: "error", reason: e.code || e.message };
  }
  if (res.error) {
    if (res.error.code === "ETIMEDOUT") return { ok: false, kind: "timeout", timeoutMs };
    return { ok: false, kind: "error", reason: res.error.code || res.error.message };
  }
  if (res.status === 0) return { ok: true };
  if (res.status == null) return { ok: false, kind: "red", reason: res.signal ? `killed by ${res.signal}` : "no exit status" };
  return { ok: false, kind: "red", reason: `exited ${res.status}` };
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

/** The blocking finding: names the phase, the box, and the failing gate (spec 050 AC #1). */
function projectGateProblem({ id, specDir, witness, gate, result }) {
  const where = witness
    ? `phase "${witness.phase}", box "${witness.box}" is ticked, but `
    : "a ticked box stands over a gate that ";
  const label = gate.bucket === "redByConstruction" ? "red-by-construction gate" : "required gate";
  return `[spec-bridge] ${id} · ${specDir}: ${where}the ${label} "${gate.name}" ${gateReason(result)}. ` +
    `A ticked tasks.md checkbox cannot outrun a red project gate — make the gate pass or set the box back.`;
}

/**
 * Pure evaluator (spec 050): run the given gates for ONE linked spec, return one blocking finding
 * per gate that is not green. `link` is { id, specDir, phaseBoxes }; `gates` the ordered flattened
 * gate list (the caller picks the buckets — the two entry points differ there); `run` executes one
 * command and returns runGateCommand's shape (injected so tests need no subprocess). The witness box
 * is computed once from phaseBoxes so every finding names it.
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

const MARKER = /^Spec:\s*(\S+?)\/?\s*$/m;
const RANK = { "to do": 0, "in progress": 1, done: 2 };
const DERIVED_RANK = { [STATUS.TODO]: 0, [STATUS.IN_PROGRESS]: 1, [STATUS.DONE_ELIGIBLE]: 2 };

/**
 * Parse one Backlog task file. Returns { id, status, specDir, acs } for a linked task,
 * null for anything else (no marker, unreadable, or not a task file). `acs` is the task's
 * acceptance criteria as [{ index, checked, text }] read from the AC:BEGIN/END block —
 * still read-only; the plan command needs them to compute reconciling edits.
 */
export function parseLinkedTask(raw) {
  const text = String(raw ?? "");
  const marker = text.match(MARKER);
  if (!marker) return null;
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const field = (name) => fm[1].match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, "m"))?.[1]?.replace(/^['"]|['"]$/g, "") ?? "";
  const id = field("id");
  const status = field("status");
  if (!id) return null;
  const acs = [];
  const block = text.match(/<!-- AC:BEGIN -->([\s\S]*?)<!-- AC:END -->/);
  if (block)
    for (const m of block[1].matchAll(/^- \[( |x|X)\] #(\d+)\s+(.*\S)\s*$/gm))
      acs.push({ index: +m[2], checked: m[1] !== " ", text: m[3] });
  return { id, status, specDir: marker[1], acs };
}

/** Scan <root>/backlog/tasks/*.md for linked tasks. Unreadable files are skipped. */
export function findLinkedTasks(root) {
  const dir = join(root, "backlog", "tasks");
  let entries = [];
  try { entries = readdirSync(dir); } catch { return []; }
  const linked = [];
  for (const name of entries.filter((n) => n.endsWith(".md")).sort()) {
    try {
      const task = parseLinkedTask(readFileSync(join(dir, name), "utf8"));
      if (task) linked.push({ ...task, file: join(dir, name) });
    } catch { /* skip unreadable */ }
  }
  return linked;
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
 *   problems — blocking messages, one per "exceeds"
 *   warnings — non-blocking messages, one per "lags"
 */
export function checkBridge(root, { runGates = true, run } = {}) {
  const links = [];
  const problems = [];
  const warnings = [];
  const config = loadBridgeConfig(root);
  const requireAnalysis = config.strictDone === true;
  const profile = vocabularyProfile(config);
  const gatesProfile = projectGatesProfile(config);
  // Run declared project gates only when they're opted into and the caller asked for it (the Stop
  // hook runs them in `check` but not the duplicate `warn` pass). SPEC_BRIDGE_GATE_ACTIVE, set on
  // every child runGateCommand spawns, is the reentrancy guard: a host gate command that itself
  // re-invokes the bridge short-circuits instead of forking forever (spec 050 R4). But that guard
  // exists to stop the DEFAULT runner from spawning real subprocesses — an injected `run` is a
  // test double that spawns nothing, so it MUST bypass the guard (spec 050 defect 1, Phase 5).
  // Without this bypass the bridge's own dogfood reddens its `tests` gate: `node --test` runs the
  // Phase-3 suite with the flag set, and every injected-run test there fail-closes to [].
  const injected = run !== undefined;
  const execGates = runGates && !!gatesProfile && (injected || process.env.SPEC_BRIDGE_GATE_ACTIVE !== "1");
  const runOne = memoizeRun(run || ((command) => runGateCommand(command, { cwd: root })));
  for (const task of findLinkedTasks(root)) {
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

    // Project-gate check (spec 050 R4): execute declared gates ONLY when the spec is
    // Done-eligible — the one bounded moment a red gate under a ticked box changes an outcome,
    // so ordinary turns pay zero subprocess cost. At Done-eligible the mid-PR window has closed
    // (every box, including the re-pin box, is ticked), so BOTH buckets must be green: required,
    // AND redByConstruction — its "allowed red mid-PR" license has expired now that its re-pin
    // was claimed done. Any red / unrunnable / timed-out gate is a blocking finding.
    if (execGates && derived.status === STATUS.DONE_ELIGIBLE) {
      const gates = gatesFor(gatesProfile, ["required", "redByConstruction"]);
      problems.push(
        ...evaluateProjectGates(
          { id: task.id, specDir: task.specDir, phaseBoxes: derived.phaseBoxes }, gates, runOne)
      );
    }
  }
  return { links, problems, warnings };
}

/**
 * The `verify` entry point (spec 050 R4): the mid-PR counterpart to the Stop hook. For every
 * linked spec that has at least one ticked box — a box claiming greenness — run the declared
 * gates and return the blocking findings. A Done-eligible spec is held to BOTH buckets (as the
 * Stop hook does); a mid-PR spec to `required` only, because redByConstruction gates are
 * legitimately red between a source edit and its re-pin commit. Shares evaluateProjectGates, so
 * it and the Stop hook agree by construction. Read-only like the rest of gates/: it runs the
 * host's declared subprocesses but writes nothing itself. Injectable `run` for tests.
 */
export function verifyBridge(root, { run } = {}) {
  const problems = [];
  const config = loadBridgeConfig(root);
  const gatesProfile = projectGatesProfile(config);
  if (!gatesProfile) return problems; // no opt-in → nothing to do
  // Reentrancy guard (spec 050 defect 1, Phase 5): a spawned gate command that re-invokes the
  // bridge with the DEFAULT runner short-circuits so it can't fork forever; an injected `run` is
  // a test double that spawns nothing, so it bypasses the guard.
  const injected = run !== undefined;
  if (!injected && process.env.SPEC_BRIDGE_GATE_ACTIVE === "1") return problems;
  const requireAnalysis = config.strictDone === true;
  // Share each distinct gate result across every spec this invocation checks (spec 050 defect 2).
  const runOne = memoizeRun(run || ((command) => runGateCommand(command, { cwd: root })));
  for (const task of findLinkedTasks(root)) {
    const derived = deriveSpecState(join(root, task.specDir), { requireAnalysis });
    const anyTicked = (derived.phaseBoxes || []).some((p) => (p.boxes || []).some((b) => b.checked));
    if (!anyTicked) continue; // nothing claims greenness yet — no tick to outrun a gate
    const buckets = derived.status === STATUS.DONE_ELIGIBLE
      ? ["required", "redByConstruction"]
      : ["required"];
    const gates = gatesFor(gatesProfile, buckets);
    problems.push(
      ...evaluateProjectGates(
        { id: task.id, specDir: task.specDir, phaseBoxes: derived.phaseBoxes }, gates, runOne)
    );
  }
  return problems;
}

/* ── plan: the exact backlog edits that reconcile the board ────────────── */

const PHASE_PREFIX = "Spec phase: ";

/** Single-quote a string for verbatim shell use. */
const sq = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

/**
 * Pure planner for ONE linked task: the ordered `backlog task edit` commands that reconcile
 * it to its derived state. Command order matters and is: status move → stale phase-AC
 * removals (highest index first, so earlier indexes stay valid) → phase-AC additions →
 * check/uncheck at post-edit indexes → one progress note (only when something changed).
 * ACs that don't start with "Spec phase: " are human-authored and are never touched.
 *
 * With an opted-in vocabulary profile (third argument), status targets are the profile's
 * stage names instead of the 3-status collapse. Done keeps its meaning: a board that leaves
 * "reviewing" at its default still plans `-s Done` with the derived final summary; a board
 * that names it (say "In Review") is planned to that name, and moving to Done stays a
 * human/consumer act the gate already accepts (Done never exceeds a fully-proven spec).
 */
export function planLinkedTask(task, derived, profile = null) {
  const cmds = [];
  const edit = (args) => cmds.push(`backlog task edit ${task.id} ${args}`);

  // Status — Done-eligible is the only path to Done and carries the derived final summary.
  const mapped = profile ? profile.names[derived.stage] : null;
  const target = derived.status === STATUS.DONE_ELIGIBLE
    ? (mapped && mapped.toLowerCase() !== "done" ? mapped : "Done")
    : (mapped ?? derived.status);
  const statusChanged = String(task.status).toLowerCase() !== target.toLowerCase();
  if (statusChanged) {
    if (target === "Done")
      edit(`-s ${sq("Done")} --final-summary ${sq(`All spec tasks complete (${derived.progressNote}). Derived Done by spec-bridge sync.`)}`);
    else edit(`-s ${sq(target)}`);
  }

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
  for (const i of [...removed].sort((a, z) => z - a)) edit(`--remove-ac ${i}`);

  const additions = (derived.phases || []).filter((p) => !seen.has(p.name));
  for (const p of additions) edit(`--ac ${sq(PHASE_PREFIX + p.name)}`);

  // Post-edit indexes: survivors keep their relative order and renumber from 1; additions
  // append after them, unchecked. Check/uncheck against what each phase actually proves.
  const survivors = (task.acs || []).filter((a) => !removed.has(a.index));
  const finalList = [
    ...survivors.map((a) => ({ text: a.text, checked: a.checked })),
    ...additions.map((p) => ({ text: PHASE_PREFIX + p.name, checked: false })),
  ];
  finalList.forEach((item, i) => {
    if (!item.text.startsWith(PHASE_PREFIX)) return; // human-authored: never touched
    const p = phaseByName.get(item.text.slice(PHASE_PREFIX.length));
    if (!p) return;
    const want = p.total > 0 && p.done === p.total;
    if (want && !item.checked) edit(`--check-ac ${i + 1}`);
    else if (!want && item.checked) edit(`--uncheck-ac ${i + 1}`);
  });

  // One note, only when this sync changed something — no churn in the task history.
  if (cmds.length) {
    const suffix = statusChanged ? ` — status ${task.status} → ${target}` : "";
    edit(`--append-notes ${sq(`spec-bridge sync: ${derived.progressNote}${suffix}`)}`);
  }
  return cmds;
}

/**
 * Plan every linked task under <root>, in queue order. Returns:
 *   commands — ordered `backlog task edit` lines; empty on a reconciled board (no-op)
 *   skipped  — [{ id, status }] for verdict-unknown tasks (custom status: don't guess)
 * Read-only like everything in gates/: plan PRINTS edits, it never executes them.
 */
export function planBridge(root) {
  const commands = [];
  const skipped = [];
  const config = loadBridgeConfig(root);
  const requireAnalysis = config.strictDone === true;
  const profile = vocabularyProfile(config);
  for (const task of findLinkedTasks(root)) {
    const derived = deriveSpecState(join(root, task.specDir), { requireAnalysis });
    const v = profile ? stageVerdict(task.status, derived.stage, profile) : verdict(task.status, derived.status);
    if (v === "unknown") { skipped.push({ id: task.id, status: task.status }); continue; }
    commands.push(...planLinkedTask(task, derived, profile));
  }
  return { commands, skipped };
}

/**
 * The Stop-hook gate, in gate-runner shape. Roots are directories holding a backlog/ dir;
 * a root with no linked tasks yields no problems, so the gate is a natural no-op outside
 * bridged projects. "exceeds" blocks; "lags" only warns.
 */
export const bridgeGate = {
  name: "spec-bridge",
  resolveRoots: (startDir) => findRootsDownwards(startDir, hasChild("backlog")),
  // The runner calls check() then warn() per root; run the (possibly costly) project-gate
  // commands only in check so a Stop pays for them once, not twice. Warnings never depend on
  // gate execution, so runGates:false loses nothing.
  check: (root) => checkBridge(root, { runGates: true }).problems,
  warn: (root) => checkBridge(root, { runGates: false }).warnings,
};
