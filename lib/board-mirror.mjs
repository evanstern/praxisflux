// board-mirror.mjs — the tracked board mirror: one schema every board provider projects into.
//
// `.board/links.json` at the project root — TRACKED in git (it is evidence, not transport;
// contrast the gitignored `.handoff/` transport). Shape:
//
//   {
//     "schema": 1,
//     "provider": "backlog",
//     "generatedAt": "<ISO 8601>",
//     "links": [
//       { "id": "TASK-109", "status": "In Progress", "specDir": "specs/052-board-adapter-seam",
//         "acs": [ { "index": 1, "checked": true, "text": "Spec phase: Seam" } ],
//         "labels": ["paused"],
//         "observedAt": "<ISO 8601>", "observedSha": "<git sha>" }
//     ]
//   }
//
// `id` / `status` / `specDir` / `acs` are exactly spec-bridge's per-task shape (see
// `findLinkedTasks` in `spec-bridge/gates/bridge.mjs`) minus `file` — the verdict engine's
// input is unchanged in substance, so a later spec can swap the source without touching the
// logic. `observedAt` / `observedSha` exist for providers whose projection needs a model
// (MCP-backed boards); a deterministic provider MAY set them, nothing requires it to.
//
// `labels` (spec 055 R4, additive to spec 052's schema) is an OPTIONAL array of strings per
// link. A mirror that omits it still validates — `projectBacklog` itself omits the key for a
// task with no labels, so an unlabelled task's link stays byte-identical to before this field
// existed. It exists so `docs/task-labels.md`'s Reserved `paused` label — machine-read by
// `pdlc:sweep`'s paused-lane doctrine — can be resolved from the mirror alone, without
// assuming `backlog/tasks/*.md` is present to read frontmatter from directly (the case a
// Jira-only project is in; see `isPausedLink` below). Both providers project it; neither is
// required to emit it for an unlabelled link.
//
// `schema` is an integer; a `schema` this module does not recognize is a HARD ERROR on read —
// never a silent best-effort parse (fail-closed, docs/wiki/gates-convention.md). Unknown
// top-level and per-link keys round-trip: read a mirror, write it back, and every key this
// module doesn't know about comes back unchanged — so a future provider can add fields
// without this version destroying them.
//
// `writeMirror` is BYTE-DETERMINISTIC: explicit key order, 2-space indent, trailing newline,
// `links` sorted by natural id order (`TASK-9` before `TASK-10`, `TASK-6.2` before
// `TASK-6.10`). `generatedAt` is a timestamp, so a caller comparing two writes for drift
// (the `--check` CLI, phase 4) must normalize it on both sides first — this module does not
// exclude it from what it writes.
//
// Zero dependencies, pure Node, no network (lib/README.md convention).
//
// Dual-use: `node lib/board-mirror.mjs --check --root <dir>` mechanizes drift for a
// deterministic provider and staleness for a model-backed one (see the CLI block below).
//
// `.board.json` (spec 054) is the OTHER file this module owns, and a different question from
// the mirror above: `.board/links.json` is BOARD STATE (what's linked, its status);
// `.board.json` is BOARD CONFIG (which provider a project uses, and that provider's
// coordinates). Tracked, hand-editable, at the project root, outside every marker — same
// posture as `.claude/model-tiers.json` (plant only when absent; doctrine points at the config;
// the config is what you edit, not something generated). `loadBoardConfig`/`validateBoardConfig`
// near the `providers` registry below read/check it.
//
// `.board.json`'s `statusMap` (bridge status -> site workflow status) composes with
// `.spec-bridge.json`'s `statusVocabulary` (derivation stage -> bridge status, bridge.mjs:69)
// at a DIFFERENT layer — the two do not merge, and this is the written precedence:
//
//   derivation stage ──statusVocabulary──▶ bridge status ──statusMap──▶ site workflow status
//      (reviewing)                          ("In Review")                 ("In Review")
//
// Unmapped statuses fall through unchanged at either layer. Neither file's meaning changes;
// this is only the stated relationship between them (two undocumented status mappings is a bug
// factory).

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { runAsCli } from "./cli.mjs";
import { TASK_LINE } from "./spec-derive.mjs";

/** The only schema this module understands. */
export const CURRENT_SCHEMA = 1;

/** Where the mirror lives, relative to a project root. */
export function mirrorPath(root) {
  return join(root, ".board", "links.json");
}

/**
 * Natural comparator for board ids such as "TASK-9", "TASK-10", "TASK-6.2", "TASK-6.10":
 * splits each id into runs of digits vs. non-digits and compares digit runs numerically, so
 * "TASK-9" sorts before "TASK-10" and "TASK-6.2" before "TASK-6.10" — a plain string sort
 * gets both wrong (dotted subtask ids are real board shapes, per plan.md).
 */
export function compareIds(a, b) {
  const parts = (s) => String(s).match(/\d+|\D+/g) || [];
  const as = parts(a);
  const bs = parts(b);
  const len = Math.max(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const x = as[i] ?? "";
    const y = bs[i] ?? "";
    if (x === y) continue;
    const xNum = /^\d+$/.test(x);
    const yNum = /^\d+$/.test(y);
    if (xNum && yNum) {
      const d = Number(x) - Number(y);
      if (d) return d;
      continue;
    }
    return x < y ? -1 : 1;
  }
  return 0;
}

/** Read `<root>/.board/links.json`. `null` when absent; throws on malformed JSON or an
 *  unrecognized `schema` — a broken mirror is a blocking problem, never an empty board. */
export function readMirror(root) {
  const path = mirrorPath(root);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${path}: malformed JSON (${e.message})`);
  }
  if (parsed?.schema !== CURRENT_SCHEMA) {
    throw new Error(`${path}: unknown schema ${JSON.stringify(parsed?.schema)} (this module knows schema ${CURRENT_SCHEMA})`);
  }
  return parsed;
}

const TOP_KEYS = ["schema", "provider", "generatedAt", "links"];
const LINK_KEYS = ["id", "status", "specDir", "acs", "labels", "observedAt", "observedSha"];
const AC_KEYS = ["index", "checked", "text"];

/** Rebuild `obj` with `knownKeys` first (in that order, when present) and every other own key
 *  after, in its original enumeration order — this is what makes unknown keys round-trip. */
function orderedObject(obj, knownKeys) {
  const out = {};
  for (const k of knownKeys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!knownKeys.includes(k)) out[k] = obj[k];
  return out;
}

/** Pure serialization shared by `writeMirror` and the `--check` CLI's byte comparison:
 *  explicit schema key order, 2-space indent, trailing newline, `links` sorted by natural id
 *  order. Does not touch disk. */
function serializeMirror(mirror) {
  const links = [...(mirror.links || [])]
    .slice()
    .sort((a, b) => compareIds(a.id, b.id))
    .map((link) => {
      const ordered = orderedObject(link, LINK_KEYS);
      if (Array.isArray(ordered.acs)) ordered.acs = ordered.acs.map((ac) => orderedObject(ac, AC_KEYS));
      return ordered;
    });
  const out = orderedObject({ ...mirror, links }, TOP_KEYS);
  return JSON.stringify(out, null, 2) + "\n";
}

/** Write a mirror deterministically (see `serializeMirror`). Creates `.board/` if absent.
 *  Returns the path written. */
export function writeMirror(root, mirror) {
  const path = mirrorPath(root);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeMirror(mirror));
  return path;
}

/**
 * Validate a mirror object (as returned by `readMirror` or built in memory). Returns
 * human-readable problems, empty when valid. Checks every required field's presence and
 * type, `acs` index monotonicity, and that no two links share an `id` or a `specDir` (one
 * card per spec dir is the bridge's existing contract).
 */
export function validateMirror(mirror) {
  const problems = [];
  const req = (val, name, type) => {
    const ok = type === "array" ? Array.isArray(val) : typeof val === type;
    if (!ok) problems.push(`${name}: expected ${type}, got ${val === undefined ? "missing" : typeof val}`);
    return ok;
  };

  if (!mirror || typeof mirror !== "object") {
    problems.push("mirror: expected object");
    return problems;
  }
  req(mirror.schema, "schema", "number");
  req(mirror.provider, "provider", "string");
  req(mirror.generatedAt, "generatedAt", "string");
  if (!req(mirror.links, "links", "array")) return problems;

  const seenIds = new Set();
  const seenSpecDirs = new Set();
  mirror.links.forEach((link, i) => {
    const where = `links[${i}]`;
    if (!link || typeof link !== "object") { problems.push(`${where}: expected object`); return; }
    req(link.id, `${where}.id`, "string");
    req(link.status, `${where}.status`, "string");
    req(link.specDir, `${where}.specDir`, "string");

    if (typeof link.id === "string") {
      if (seenIds.has(link.id)) problems.push(`duplicate id: ${link.id}`);
      seenIds.add(link.id);
    }
    if (typeof link.specDir === "string") {
      if (seenSpecDirs.has(link.specDir)) problems.push(`duplicate specDir: ${link.specDir}`);
      seenSpecDirs.add(link.specDir);
    }

    // labels is OPTIONAL (spec 055 R4) — a missing key is valid (backward compat with every
    // mirror written before this field existed); present-but-malformed is an error naming the
    // offending link.
    if (link.labels !== undefined) {
      if (!Array.isArray(link.labels)) {
        problems.push(`${where}.labels: expected array, got ${typeof link.labels}`);
      } else {
        link.labels.forEach((l, k) => {
          if (typeof l !== "string") problems.push(`${where}.labels[${k}]: expected string, got ${typeof l}`);
        });
      }
    }

    if (!req(link.acs, `${where}.acs`, "array")) return;
    let prev = -Infinity;
    link.acs.forEach((ac, j) => {
      const acWhere = `${where}.acs[${j}]`;
      if (!ac || typeof ac !== "object") { problems.push(`${acWhere}: expected object`); return; }
      req(ac.index, `${acWhere}.index`, "number");
      req(ac.checked, `${acWhere}.checked`, "boolean");
      req(ac.text, `${acWhere}.text`, "string");
      if (typeof ac.index === "number") {
        if (ac.index <= prev) problems.push(`${where}.acs index not monotonic increasing at [${j}] (${ac.index} after ${prev})`);
        prev = ac.index;
      }
    });
  });

  return problems;
}

/** Is this mirror link paused (`docs/task-labels.md`'s Reserved `paused` label), read from
 *  the mirror's OWN `labels` — never from `backlog/tasks/*.md`. This is the primitive
 *  `pdlc:sweep`'s paused-lane doctrine (and any future conflict-analysis script) resolves
 *  against, so a mirror-only project — no live board files to fall back on, the case a
 *  Jira-only host is in — still excludes a parked branch's task from lane-conflict analysis
 *  (spec 055 R4/AC #7). */
export function isPausedLink(link) {
  return Array.isArray(link?.labels) && link.labels.includes("paused");
}

/* ── the marked description block (spec 055 R2): render/parse pair for the Jira analogue of
 * Backlog's AC:BEGIN/END block. Lives here, not a new lib/ module, because it produces and
 * consumes exactly this file's own `acs` shape ([{ index, checked, text }]) and needs nothing
 * else. Full contract: docs/board-verbs.md "R2 — the marked description block".
 *
 * Rules: text OUTSIDE the markers is human-authored and NEVER touched — neither function reads
 * or writes past them. The block is REPLACED WHOLESALE; there is no partial-edit form. The
 * `Spec: <dir>` marker line stays OUTSIDE the block — bridge.mjs's `MARKER`
 * (`/^Spec:\s*(\S+?)\/?\s*$/m`) is unaffected either way, since it is anchored per-line and
 * matches wherever a bare `Spec: ` line sits, block or no block (verified by fixture,
 * test/board-mirror.test.mjs). ONE block per description: a second BEGIN or END is a
 * validation error, not a merge. MARKDOWN ONLY — an `html`-format read or write is a contract
 * violation, not a formatting choice: Jira's html rendering escapes the markers and swallows
 * the END marker inside the final task-list `<li>` (verified live, spec 056 phase 1,
 * specs/056-jira-provider/findings/phase-1-mcp-surface.md).
 *
 * Indexes are POSITIONAL (1-based) within the block — a position, not an identity. A reordered
 * block renumbers.
 *
 * `parseSpecPhasesBlock` tolerates two normalizations a live Jira write→read round-trip is known
 * to introduce on EVERY read (same findings file): a blank line inserted immediately after
 * BEGIN (skipped here — a blank line is never a checkbox line) and two trailing spaces appended
 * to the LAST checkbox line (needs no extra handling: TASK_LINE's own `(\S.*?)\s*$` already
 * strips trailing whitespace from the captured text). Reuses TASK_LINE from spec-derive.mjs
 * rather than a third checkbox regex. */

const SPEC_PHASES_BEGIN = "<!-- spec-phases BEGIN -->";
const SPEC_PHASES_END = "<!-- spec-phases END -->";

/** Render items ([{ checked, text }], in order) as the block's exact text, markers included. */
export function renderSpecPhasesBlock(items) {
  const lines = items.map((it) => `- [${it.checked ? "x" : " "}] ${it.text}`);
  return [SPEC_PHASES_BEGIN, ...lines, SPEC_PHASES_END].join("\n");
}

/**
 * Parse a description (or any string containing at most one block) into
 * [{ index, checked, text }], 1-based positional — [] when no block is present (absent is not
 * an error; only a duplicated block is). Throws when more than one BEGIN or END marker is
 * found, naming the counts.
 */
export function parseSpecPhasesBlock(text) {
  const s = String(text ?? "");
  const beginCount = s.split(SPEC_PHASES_BEGIN).length - 1;
  const endCount = s.split(SPEC_PHASES_END).length - 1;
  if (beginCount > 1 || endCount > 1)
    throw new Error(`spec-phases block: found ${beginCount} BEGIN marker(s) and ${endCount} END marker(s) — exactly one block is allowed per description`);
  const start = s.indexOf(SPEC_PHASES_BEGIN);
  const stop = s.indexOf(SPEC_PHASES_END);
  if (start === -1 || stop === -1) return [];
  if (stop < start) throw new Error("spec-phases block: END marker precedes BEGIN marker");
  const inner = s.slice(start + SPEC_PHASES_BEGIN.length, stop);
  const items = [];
  for (const line of inner.split("\n")) {
    if (line.trim() === "") continue; // tolerates the blank line Jira inserts after BEGIN
    const m = line.match(TASK_LINE);
    if (!m) continue;
    items.push({ index: items.length + 1, checked: m[1] !== " ", text: m[2] });
  }
  return items;
}

/* ── the backlog projector: parses backlog/tasks/*.md, moved from spec-bridge/gates/bridge.mjs ──
 *
 * Moved rather than duplicated (spec 052 phase 2): two parsers would silently drift the first
 * time either is patched. `bridge.mjs` re-exports both symbols so every existing import site
 * still resolves. */

const MARKER = /^Spec:\s*(\S+?)\/?\s*$/m;

/** Parse a frontmatter block's `labels:` field — either Backlog.md's actual YAML block-list
 *  form (`labels:\n  - a\n  - b\n`) or an inline form (`labels: []`, `labels: [a, b]`).
 *  Returns [] when absent, empty, or unparseable — never throws. */
function parseFrontmatterLabels(fm) {
  const m = fm.match(/^labels:(.*)$/m);
  if (!m) return [];
  const strip = (s) => s.trim().replace(/^['"]|['"]$/g, "");
  const rest = m[1].trim();
  if (rest) {
    const inline = rest.match(/^\[(.*)\]$/);
    return inline ? inline[1].split(",").map(strip).filter(Boolean) : [];
  }
  const items = [];
  for (const line of fm.slice(fm.indexOf(m[0]) + m[0].length).split("\n")) {
    if (line.trim() === "") continue; // the blank remainder of the "labels:" line itself
    const li = line.match(/^\s*-\s*(.+?)\s*$/);
    if (!li) break;
    items.push(strip(li[1]));
  }
  return items;
}

/**
 * Parse one Backlog task file. Returns { id, status, specDir, acs } for a linked task, null
 * for anything else (no marker, unreadable, or not a task file). `acs` is the task's
 * acceptance criteria as [{ index, checked, text }] read from the AC:BEGIN/END block — still
 * read-only; the plan command needs them to compute reconciling edits. `labels` (spec 055
 * R4) is included ONLY when the task's frontmatter `labels:` list is non-empty — an
 * unlabelled task's return value stays byte-identical to before this field existed (this is
 * load-bearing: test/spec-bridge.test.mjs asserts the exact shape and is frozen — specs
 * 052-055 all state it must pass unmodified).
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
  const labels = parseFrontmatterLabels(fm[1]);
  const linked = { id, status, specDir: marker[1], acs };
  if (labels.length) linked.labels = labels;
  return linked;
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

/** The `backlog` provider's projector (spec 052 R4): `findLinkedTasks`' output reshaped to
 *  exactly the mirror's per-link fields (drops `file`). `labels` (spec 055 R4) rides straight
 *  through — `parseLinkedTask` already omits it for an unlabelled task, so this needs no
 *  extra logic to keep an unlabelled projection byte-identical to before this field existed. */
export function projectBacklog(root) {
  return findLinkedTasks(root).map(({ id, status, specDir, acs, labels }) => (
    labels ? { id, status, specDir, acs, labels } : { id, status, specDir, acs }
  ));
}

/** Provider registry (spec 052 R4): provider name -> { requiresSync, project }.
 *  `requiresSync: false` — the projection is deterministic; `project(root)` recomputes it and
 *  `--check` can diff it byte-for-byte against the on-disk mirror.
 *  `requiresSync: true` — the projection needs a model (MCP-backed boards); `project` is
 *  `null` because no `node`-only recompute exists, and `--check` can only assess staleness.
 *  The *type* of `project` (function vs. `null`) carries the distinction — spec 056 adds
 *  `jira` by adding one key here; no `if (provider === "...")` branch belongs anywhere. */
export const providers = {
  backlog: { requiresSync: false, project: projectBacklog },
};

/* ── `.board.json` config schema (spec 054) — a SEPARATE, smaller table from `providers`
 * above. `providers` is the projector registry (spec 052/056): provider name -> how to
 * recompute the mirror. This table only knows the config-schema shape — which provider names
 * are legal and which fields each requires — so `.board.json` can be validated today without
 * pre-empting spec 056's ownership of adding `jira`'s projector entry to `providers`. Do NOT
 * fold these two tables into one: that would re-couple config validation to projector
 * implementation, which is exactly the coupling keeping them apart avoids. */
const BOARD_CONFIG_PROVIDERS = {
  backlog: { requiredFields: [] },
  jira: { requiredFields: ["cloudId", "projectKey", "issueTypeName"] },
};

/** Load `<root>/.board.json`. Returns `{ provider: "backlog" }` when absent — spec 053's
 *  backward-compatible default. Throws on malformed JSON (fail closed). Throws naming the known
 *  providers on an unknown `provider` value — NEVER falls back to `backlog`: silently treating
 *  a Jira project as a Backlog project is the exact silent no-op this feature exists to
 *  remove. */
export function loadBoardConfig(root) {
  const path = join(root, ".board.json");
  if (!existsSync(path)) return { provider: "backlog" };
  const raw = readFileSync(path, "utf8");
  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${path}: malformed JSON (${e.message})`);
  }
  const name = config?.provider;
  if (!BOARD_CONFIG_PROVIDERS[name])
    throw new Error(`${path}: unknown board provider ${JSON.stringify(name)} (known: ${Object.keys(BOARD_CONFIG_PROVIDERS).join(", ")})`);
  return config;
}

/** Validate a `.board.json` object (as returned by `loadBoardConfig` or built in memory).
 *  Returns human-readable problems, empty when valid. Catches: `provider` as an array (one
 *  board is the plan of record — a list is a validation error saying why) or other non-string,
 *  an unknown provider name, a known provider missing one of its required fields (`jira` needs
 *  `cloudId`/`projectKey`/`issueTypeName`), and a non-object `statusMap`. */
export function validateBoardConfig(config) {
  const problems = [];
  if (!config || typeof config !== "object") {
    problems.push("config: expected object");
    return problems;
  }
  const name = config.provider;
  if (Array.isArray(name)) {
    problems.push("provider: expected a single string, got an array (one board is the plan of record)");
  } else if (typeof name !== "string") {
    problems.push(`provider: expected string, got ${name === undefined ? "missing" : typeof name}`);
  } else if (!BOARD_CONFIG_PROVIDERS[name]) {
    problems.push(`provider: unknown board provider "${name}" (known: ${Object.keys(BOARD_CONFIG_PROVIDERS).join(", ")})`);
  } else {
    const { requiredFields } = BOARD_CONFIG_PROVIDERS[name];
    const sub = config[name] || {};
    for (const field of requiredFields)
      if (!sub[field]) problems.push(`${name}.${field}: required for provider "${name}"`);
    if (sub.statusMap !== undefined && (typeof sub.statusMap !== "object" || Array.isArray(sub.statusMap) || sub.statusMap === null))
      problems.push(`${name}.statusMap: expected object, got ${Array.isArray(sub.statusMap) ? "array" : typeof sub.statusMap}`);
  }
  return problems;
}

/** Run git argv `args` in `cwd`. Never throws — a git failure is data, not an exception,
 *  matching grounding-wiki/gates/repin-window.mjs's `git()` helper shape (spawnSync, argv
 *  array so there is no shell, utf8 encoding). Returns `{ status, out }`; `status` is `null`
 *  when the process itself could not be spawned (e.g. `git` missing). */
function runGit(cwd, args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.error) return { status: null, out: "" };
  return { status: r.status, out: (r.stdout || "").trim() };
}

/**
 * Is a mirror stale? Fail-closed per R3/docs/wiki/gates-convention.md: every unknown resolves
 * to `stale: true` with a stated reason, never a silent "looks fine".
 *
 * Three cases produce `stale: true`:
 *   1. a link's `observedSha` is not an ancestor of `headSha` (mirror observed on history this
 *      tree no longer contains, or a foreign/rewritten history);
 *   2. a link has no `observedSha` and its provider is `requiresSync: true` (a receipt-less
 *      MCP-backed mirror is not evidence);
 *   3. `root` is not a git repo, or the sha is unknown to it — `git merge-base --is-ancestor`
 *      cannot answer, so no honest claim of freshness exists.
 *
 * Ancestry uses `git merge-base --is-ancestor <sha> <headSha>` (exit 0 = ancestor, exit 1 =
 * not an ancestor, anything else = unknown/error) via `runGit`, the same spawnSync shape
 * grounding-wiki's freshness gate uses for pins. `headSha` defaults to `"HEAD"` so a caller
 * that already has the working tree's HEAD checked out need not resolve it separately.
 */
export function mirrorStaleness(root, mirror, { headSha = "HEAD" } = {}) {
  if (!mirror || !Array.isArray(mirror.links)) return { stale: false, reason: null };
  const provider = providers[mirror.provider];
  // Unknown provider name: fail closed rather than assume it is safely deterministic.
  const requiresSync = provider ? provider.requiresSync : true;

  for (const link of mirror.links) {
    if (!link.observedSha) {
      if (requiresSync)
        return { stale: true, reason: `${link.id}: no observedSha on requiresSync provider "${mirror.provider}"` };
      continue;
    }
    const r = runGit(root, ["merge-base", "--is-ancestor", link.observedSha, headSha]);
    if (r.status === 1)
      return { stale: true, reason: `${link.id}: observedSha ${link.observedSha} is not an ancestor of ${headSha}` };
    if (r.status !== 0)
      return { stale: true, reason: `${link.id}: cannot verify observedSha ${link.observedSha} (not a git repo, or the sha is unknown)` };
  }
  return { stale: false, reason: null };
}

/* ── --check CLI (spec 052 R5), dual-use via lib/cli.mjs's runAsCli guard ──
 *
 * node lib/board-mirror.mjs --check --root <dir>
 *
 * Exit codes match spec-bridge/gates/cli.mjs's convention: 0 clean, 1 findings, 2 env error
 * (unreadable root, unknown provider, usage error). A malformed/unknown-schema mirror is a
 * FINDING (1), not an env error — it is the artifact that is broken, not the invocation.
 *
 * requiresSync: false — recompute the provider's projection and byte-compare it against the
 * on-disk mirror via `serializeMirror`, with `generatedAt` normalized on both sides (it's a
 * timestamp, not a fact to diff). requiresSync: true — cannot recompute; validate + check
 * staleness only. No mirror at all — exit 0, "no mirror; nothing to check" (a project that
 * hasn't adopted the seam is not in violation of it). */
if (runAsCli(import.meta.url)) {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf("--root");
  if (!args.includes("--check") || rootIdx === -1 || !args[rootIdx + 1]) {
    console.error("usage: node lib/board-mirror.mjs --check --root <dir>");
    process.exit(2);
  }
  const root = resolve(args[rootIdx + 1]);
  if (!existsSync(root)) {
    console.error(`board-mirror: root not found: ${root}`);
    process.exit(2);
  }

  let mirror;
  try {
    mirror = readMirror(root);
  } catch (e) {
    console.log(`board-mirror check FAILED: ${e.message}`);
    process.exit(1);
  }

  if (!mirror) {
    console.log("board-mirror: no mirror; nothing to check");
    process.exit(0);
  }

  const problems = validateMirror(mirror);
  if (problems.length) {
    console.log(`board-mirror check FAILED (${problems.length} issue(s)):`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }

  const provider = providers[mirror.provider];
  if (!provider) {
    console.error(`board-mirror: unknown provider "${mirror.provider}"`);
    process.exit(2);
  }

  if (provider.requiresSync) {
    const { stale, reason } = mirrorStaleness(root, mirror);
    if (stale) {
      console.log(`board-mirror check FAILED: stale — ${reason}`);
      process.exit(1);
    }
    console.log(`board-mirror ok: ${mirror.provider} mirror valid, not stale (requiresSync — drift not recomputable)`);
    process.exit(0);
  }

  const recomputed = { ...mirror, links: provider.project(root), generatedAt: "" };
  const onDisk = { ...mirror, generatedAt: "" };
  const expected = serializeMirror(onDisk);
  const actual = serializeMirror(recomputed);
  if (expected !== actual) {
    const strip = (l) => ({ id: l.id, status: l.status, specDir: l.specDir, acs: l.acs });
    const byId = (arr) => Object.fromEntries(arr.map((l) => [l.id, l]));
    const a = byId(onDisk.links || []);
    const b = byId(recomputed.links);
    const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
    const drifted = [...ids].filter((id) => JSON.stringify(a[id] && strip(a[id])) !== JSON.stringify(b[id] && strip(b[id])));
    console.log(`board-mirror check FAILED: mirror drifted from the recomputed "${mirror.provider}" projection`);
    for (const id of drifted.sort(compareIds)) console.log(`  - ${id}: on-disk mirror does not match the recomputed projection`);
    process.exit(1);
  }
  console.log(`board-mirror ok: ${mirror.provider} mirror matches the recomputed projection (${recomputed.links.length} link(s))`);
  process.exit(0);
}
