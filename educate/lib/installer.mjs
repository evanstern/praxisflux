// installer.mjs — the shared "plant a project" helpers used by each plugin's start skill.
//
// A plugin has no always-on context slot, so it installs a project CLAUDE.md + scaffolding.
// These helpers make that dotfile-safe, idempotent, and honest (verify on disk, never clobber
// what the user has grown). Zero-dependency.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * Recursively copy `src` → `dest`. Uses node:fs cp, which copies dotfiles (e.g. `.template/`)
 * — the copy helpers that silently drop `.`-prefixed names are exactly what this avoids.
 * `overwrite:false` leaves an existing dest untouched.
 */
export function copyDir(src, dest, { overwrite = true } = {}) {
  cpSync(src, dest, { recursive: true, force: overwrite, errorOnExist: false });
}

/** Copy a single file, creating parent dirs. Returns false if it existed and overwrite is off. */
export function copyFile(src, dest, { overwrite = true } = {}) {
  if (!overwrite && existsSync(dest)) return false;
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { force: true });
  return true;
}

/**
 * Ensure `.gitignore` in `root` contains `entry` (e.g. `.handoff/`), creating the file if
 * absent and preserving existing lines. Idempotent — returns true only if it added the line.
 */
export function ensureGitignore(root, entry) {
  const p = join(root, ".gitignore");
  const want = entry.trim();
  const existing = existsSync(p) ? readFileSync(p, "utf8") : "";
  if (existing.split("\n").some((l) => l.trim() === want)) return false;
  const prefix = existing === "" ? "" : existing.replace(/\n*$/, "\n");
  writeFileSync(p, prefix + want + "\n");
  return true;
}

/** Which of `relPaths` (relative to `root`) are missing on disk. Empty = all present. */
export function verifyPresent(root, relPaths) {
  return relPaths.filter((r) => !existsSync(join(root, r)));
}

/**
 * Decide install mode from the project root: `fresh` if none of the `markers` exist yet,
 * else `update`. Lets a start skill branch between a clean install and an idempotent migrate.
 */
export function installMode(root, markers) {
  return markers.some((m) => existsSync(join(root, m))) ? "update" : "fresh";
}
