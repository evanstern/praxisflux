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

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { runAsCli } from "./cli.mjs";

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
const LINK_KEYS = ["id", "status", "specDir", "acs", "observedAt", "observedSha"];
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

/* ── the backlog projector: parses backlog/tasks/*.md, moved from spec-bridge/gates/bridge.mjs ──
 *
 * Moved rather than duplicated (spec 052 phase 2): two parsers would silently drift the first
 * time either is patched. `bridge.mjs` re-exports both symbols so every existing import site
 * still resolves. */

const MARKER = /^Spec:\s*(\S+?)\/?\s*$/m;

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

/** The `backlog` provider's projector (spec 052 R4): `findLinkedTasks`' output reshaped to
 *  exactly the mirror's per-link fields (drops `file`). */
export function projectBacklog(root) {
  return findLinkedTasks(root).map(({ id, status, specDir, acs }) => ({ id, status, specDir, acs }));
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
