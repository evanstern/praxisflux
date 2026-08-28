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

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

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

/** Write a mirror deterministically: explicit schema key order, 2-space indent, trailing
 *  newline, `links` sorted by natural id order. Creates `.board/` if absent. Returns the path
 *  written. */
export function writeMirror(root, mirror) {
  const links = [...(mirror.links || [])]
    .slice()
    .sort((a, b) => compareIds(a.id, b.id))
    .map((link) => {
      const ordered = orderedObject(link, LINK_KEYS);
      if (Array.isArray(ordered.acs)) ordered.acs = ordered.acs.map((ac) => orderedObject(ac, AC_KEYS));
      return ordered;
    });
  const out = orderedObject({ ...mirror, links }, TOP_KEYS);
  const path = mirrorPath(root);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
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
