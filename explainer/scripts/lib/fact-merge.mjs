// Folds a fact-checker re-check into the main fact-check file. The
// fact-checker agent's first pass writes dist/fact-check.json; when the fix
// loop re-dispatches it for a handful of pages, it writes
// dist/fact-check.recheck.json instead of touching the original (so a
// partially-finished re-check never corrupts the base file). This module is
// the mechanical step in between: fold the re-check's entries into the base
// file, one page at a time, and remove the re-check file once that's done.
//
// Pure merge logic lives in mergeFactCheck() (arrays in, array out, plus a
// small summary) so it's unit-testable without touching the filesystem; the
// file-level wrapper (mergeFactCheckFiles) handles reading, validating, and
// writing dist/fact-check.json and dist/fact-check.recheck.json for the CLI.

import fs from "node:fs";
import path from "node:path";

/**
 * Checks that `value` is an array of fact-check entries — same shape
 * agents/fact-checker.md documents and scripts/lib/check.mjs's
 * runFactChecker reads: each entry an object with at least a string `page`,
 * `claim`, and `status`. Returns an error message, or null when it's valid.
 */
function validateEntries(value, label) {
  if (!Array.isArray(value)) {
    return `${label} must be a JSON array of fact-check entries`;
  }
  for (let i = 0; i < value.length; i += 1) {
    const entry = value[i];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return `${label}[${i}] must be an object`;
    }
    if (typeof entry.page !== "string") {
      return `${label}[${i}] is missing a string "page"`;
    }
    if (typeof entry.claim !== "string") {
      return `${label}[${i}] is missing a string "claim"`;
    }
    if (typeof entry.status !== "string") {
      return `${label}[${i}] is missing a string "status"`;
    }
  }
  return null;
}

/**
 * Pure merge . For every page that appears
 * anywhere in `recheck`, every one of that page's entries is dropped from
 * `base` and replaced by `recheck`'s own entries for that page, in
 * `recheck`'s order. A page `recheck` never mentions keeps its `base`
 * entries verbatim, in their original position. A `recheck` entry for a page
 * `base` had no entries for at all (e.g. a recurrence flagged on a page the
 * re-check set didn't otherwise touch) is simply appended.
 *
 * Throws on a malformed `base` or `recheck` (not an array of entries with
 * string page/claim/status) — callers that read these from disk should
 * validate first so they can report a clean, non-throwing error instead.
 *
 * Returns `{ merged, pagesReplaced, counts }`:
 * - `merged` — the folded array, ready to write back to dist/fact-check.json.
 * - `pagesReplaced` — page ids that had at least one base entry dropped and
 *   replaced (sorted, de-duplicated) — not pages that only gained a new,
 *   previously-absent recurrence entry.
 * - `counts` — a map of `merged`'s entries by status, e.g.
 *   `{ supported: 12, wrong: 1 }`.
 */
export function mergeFactCheck({ base, recheck }) {
  const baseError = validateEntries(base, "dist/fact-check.json");
  if (baseError) throw new Error(baseError);
  const recheckError = validateEntries(recheck, "dist/fact-check.recheck.json");
  if (recheckError) throw new Error(recheckError);

  const basePages = new Set(base.map((e) => e.page));
  const recheckPages = new Set(recheck.map((e) => e.page));

  const kept = base.filter((e) => !recheckPages.has(e.page));
  const merged = [...kept, ...recheck];

  const pagesReplaced = [...recheckPages].filter((p) => basePages.has(p)).sort();

  const counts = {};
  for (const e of merged) {
    counts[e.status] = (counts[e.status] ?? 0) + 1;
  }

  return { merged, pagesReplaced, counts };
}

/** Reads and validates one fact-check JSON file. Never throws. */
function readFactCheckFile(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      return { ok: false, error: `${filePath}: not found` };
    }
    return { ok: false, error: `${filePath}: ${err.message}` };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: `${filePath}: invalid JSON — ${err.message}` };
  }

  const entriesError = validateEntries(parsed, filePath);
  if (entriesError) return { ok: false, error: entriesError };

  return { ok: true, value: parsed };
}

/**
 * File-level wrapper backing the `fact-merge` CLI verb. Reads
 * `<dir>/dist/fact-check.json` and `<dir>/dist/fact-check.recheck.json`,
 * merges them, writes the result back to `fact-check.json`, then deletes
 * `fact-check.recheck.json`. Validates both files fully before writing
 * anything, so a bad input never leaves a partial write behind.
 *
 * Returns `{ ok: true, pagesReplaced, counts }` on success, or
 * `{ ok: false, error }` (nothing written) on any failure.
 */
export function mergeFactCheckFiles({ dir }) {
  const distDir = path.join(dir, "dist");
  const basePath = path.join(distDir, "fact-check.json");
  const recheckPath = path.join(distDir, "fact-check.recheck.json");

  const base = readFactCheckFile(basePath);
  if (!base.ok) return { ok: false, error: base.error };

  const recheck = readFactCheckFile(recheckPath);
  if (!recheck.ok) return { ok: false, error: recheck.error };

  let merged;
  let pagesReplaced;
  let counts;
  try {
    ({ merged, pagesReplaced, counts } = mergeFactCheck({ base: base.value, recheck: recheck.value }));
  } catch (err) {
    return { ok: false, error: err.message };
  }

  fs.writeFileSync(basePath, `${JSON.stringify(merged, null, 2)}\n`);
  fs.rmSync(recheckPath);

  return { ok: true, pagesReplaced, counts };
}
