---
name: installer
description: lib/installer.mjs — dotfile-safe, idempotent project-planting helpers (copyDir, copyFile, ensureGitignore, ensureExclude, verifyPresent, installMode) used by plugin start skills
kind: component
sources:
  - lib/installer.mjs
verified_against: fc8cac785cef4499bed8c32f25cd4cda6bc6ec14
---

# Installer

`lib/installer.mjs` holds the shared "plant a project" helpers used by each plugin's
start/init skill. Because a plugin has no always-on context slot, it installs a project
`CLAUDE.md` plus scaffolding into the user's directory; these helpers make that planting
dotfile-safe, idempotent, and honest (verified on disk, never clobbering what the user
has grown). The module is zero-dependency, using only `node:fs` and `node:path`.

## How it works

Six exports:

- `copyDir(src, dest, { overwrite = true } = {})` — recursive copy via `cpSync` with
  `{ recursive: true, force: overwrite, errorOnExist: false }`. The deliberate point is
  **dotfile safety**: `node:fs` `cpSync` copies `.`-prefixed names (e.g. a `.template/`
  directory), unlike copy helpers that silently drop them. With `overwrite: false` an
  existing destination is left untouched rather than erroring.
- `copyFile(src, dest, { overwrite = true } = {})` — copies a single file, creating
  parent directories with `mkdirSync(..., { recursive: true })`. Returns `false` (and
  does nothing) if the destination exists and overwrite is off; returns `true` otherwise.
- `ensureGitignore(root, entry)` — guarantees `<root>/.gitignore` contains `entry` (e.g.
  `.handoff/`). It creates the file if absent, preserves existing lines, matches the
  trimmed entry against each existing trimmed line, and appends with a normalized
  trailing newline. Idempotent: returns `true` only when it actually added the line.
- `ensureExclude(root, entries, { dryRun = false } = {})` — the **local-only** planting
  counterpart (spec 060 R1/R2): guarantees `<gitdir>/info/exclude` contains every line in
  `entries` instead of touching `.gitignore`, so the footprint never shows up as a tracked
  diff. An internal `resolveGitDir` handles `<root>/.git` as either a directory or a
  worktree pointer **file** (`gitdir: <path>`, resolved relative to `root`) and returns
  `null` when `.git` is absent entirely; `ensureExclude` never throws on that — it
  degrades to `{ status: "no-git", added: [] }` (R6). Otherwise it appends only lines not
  already present (creating `info/` as needed) and returns
  `{ status: "added"|"unchanged", added: string[] }`; `dryRun: true` (used by `plant`'s
  `--check`) reports what would happen without writing.
- `verifyPresent(root, relPaths)` — returns the subset of `relPaths` (relative to
  `root`) that are missing on disk; an empty array means everything planted is present.
  This is the "honest verify" step after an install.
- `installMode(root, markers)` — returns `"update"` if any marker path exists under
  `root`, else `"fresh"`. A start skill uses this to branch between a clean install and
  an idempotent migrate/upgrade of an already-planted project.

## Connections

- Part of the shared [[chassis]]; vendored into each plugin's `dist/` by
  [[build-and-release]].
- The [[handoff-protocol]] transport (`lib/handoff.mjs`) imports `ensureGitignore` so
  that `ensureHandoffDir` keeps the gitignored `.handoff/` directory out of `git status`.
- Plugin start/init skills — e.g. [[educate-plugin]]'s start and the
  [[research-plugin]]'s vault setup — plant `CLAUDE.md` and templates through these
  helpers, following the planting pattern described in [[skill-patterns]].
- [[pdlc-plugin]]'s `plant.mjs` calls `ensureExclude` for `--local-only` bootstrap
  (spec 060), the same shape `ensureGitignore` serves for tracked planting.
- Exercised by the [[test-suite]].

## Operational notes

- No environment variables; behavior is controlled entirely by arguments.
- Defaults favor overwriting (`overwrite: true` on both copy helpers); callers protecting
  user-grown files must pass `overwrite: false` explicitly.
- `ensureGitignore` and `installMode` are safe to run repeatedly; the boolean/string
  return values let skills report what actually changed.
- `verifyPresent` never throws — a missing root simply yields every path as missing.
