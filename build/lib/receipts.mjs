// receipts.mjs — the chassis receipt helper every driven port's gate reads instead of calling
// a provider (spec 073 R3, decision-0002, C2 2026-10-15).
//
// C2: a receipt lives at `.<port-dir>/<noun>.json`, tracked (not gitignored), written only
// through `writeReceipt` below — never hand-edited. `.board/links.json` (lib/board-mirror.mjs)
// is the tracker's existing receipt under this same convention and is NOT migrated here; the
// forge port (TASK-0140) will add `.forge/changes.json`.
//
// Byte-determinism: `serializeReceipt` sorts object keys recursively (arrays keep the
// caller's order — order is often meaningful there, key order never is) and always produces
// `JSON.stringify(value, null, 2) + "\n"`. This is `lib/board-mirror.mjs`'s `writeMirror`
// precedent generalized to any receipt shape: a gate (`checkReceipt`) can byte-compare a
// freshly-serialized value against the on-disk file with no provider call, so a hand-edited
// or reformatted receipt is caught even though its JSON still parses.
//
// Zero dependencies, pure Node, no network (lib/README.md convention).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

/** Recursively sort object keys; arrays keep caller order (their elements are still
 *  canonicalized). Primitives pass through unchanged. */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

/** Where a port's receipt lives: `<root>/<receiptDir>/<noun>.json`. */
export function receiptPath(root, receiptDir, noun) {
  return join(root, receiptDir, `${noun}.json`);
}

/** The canonical bytes for `value`: keys sorted recursively, 2-space indent, trailing
 *  newline. Pure — does not touch disk. */
export function serializeReceipt(value) {
  return JSON.stringify(canonicalize(value), null, 2) + "\n";
}

/** Write `value` as the canonical receipt at `receiptPath(root, receiptDir, noun)`, creating
 *  the receipt dir if absent. Returns the path written. */
export function writeReceipt(root, receiptDir, noun, value) {
  const path = receiptPath(root, receiptDir, noun);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeReceipt(value));
  return path;
}

/** Read and parse a receipt. `null` when absent. Throws on malformed JSON (fail-closed, same
 *  posture as `lib/board-mirror.mjs`'s `readMirror`). */
export function readReceipt(root, receiptDir, noun) {
  const path = receiptPath(root, receiptDir, noun);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${path}: malformed JSON (${e.message})`);
  }
}

/** Does the on-disk receipt match its own canonical bytes? `{ ok: true, reason: "absent" }`
 *  when there is no receipt (not a failure — a port with no receipt yet is not in violation of
 *  the convention). `{ ok: false, reason }` for malformed JSON or bytes that parse fine but
 *  don't match `serializeReceipt` of their own parsed value (reordered keys, reformatted
 *  whitespace, a missing trailing newline). `{ ok: true }` otherwise. Never calls a provider —
 *  this is the whole point (US3): a gate checks the receipt, not the thing it was written
 *  from. */
export function checkReceipt(root, receiptDir, noun) {
  const path = receiptPath(root, receiptDir, noun);
  if (!existsSync(path)) return { ok: true, reason: "absent" };
  const raw = readFileSync(path, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: `malformed JSON (${e.message})` };
  }
  if (raw !== serializeReceipt(parsed))
    return { ok: false, reason: "not canonical (key order, formatting, or trailing newline differs)" };
  return { ok: true };
}
