// installer.mjs — the shared "plant a project" helpers used by each plugin's start skill.
//
// A plugin has no always-on context slot, so it installs a project CLAUDE.md + scaffolding.
// These helpers make that dotfile-safe, idempotent, and honest (verify on disk, never clobber
// what the user has grown). Zero-dependency.

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

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

/**
 * Resolve the real git dir for `root`: the `.git` directory itself, or — when `.git` is a
 * worktree pointer file (`gitdir: <path>`) — the path it points at. `null` when `.git` is
 * absent (pre-`git init`, spec 060 R6) or unreadable.
 */
function resolveGitDir(root) {
  const p = join(root, ".git");
  if (!existsSync(p)) return null;
  if (statSync(p).isDirectory()) return p;
  try {
    const m = /^gitdir:\s*(.+?)\s*$/m.exec(readFileSync(p, "utf8"));
    return m ? resolve(root, m[1]) : null;
  } catch { return null; }
}

/**
 * Ensure `<gitdir>/info/exclude` contains every line in `entries` (local-only planting,
 * spec 060 R1/R2), creating `info/` as needed and appending only lines not already present.
 * Never touches `.gitignore`. Returns `{ status: "no-git" }` (nothing written — R6) when
 * `root` has no `.git`, else `{ status: "added"|"unchanged", added: string[] }`.
 */
export function ensureExclude(root, entries) {
  const gitDir = resolveGitDir(root);
  if (!gitDir) return { status: "no-git", added: [] };
  const p = join(gitDir, "info", "exclude");
  const existing = existsSync(p) ? readFileSync(p, "utf8") : "";
  const have = new Set(existing.split("\n").map((l) => l.trim()));
  const toAdd = entries.map((e) => e.trim()).filter((e) => !have.has(e));
  if (toAdd.length === 0) return { status: "unchanged", added: [] };
  mkdirSync(dirname(p), { recursive: true });
  const prefix = existing === "" ? "" : existing.replace(/\n*$/, "\n");
  writeFileSync(p, prefix + toAdd.join("\n") + "\n");
  return { status: "added", added: toAdd };
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
