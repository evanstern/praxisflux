---
name: start
description: Initialize a new Socratic learning project in a folder, OR update an existing one to the current plugin version. Use when the user wants to set up educate, bootstrap a learnings folder, start a learning project, create the structure for teach-me lessons, or migrate/upgrade an existing educate project after a plugin update. Plants (or refreshes) the always-on CLAUDE.md, the lesson template, and the progress schema, then verifies the setup.
---

# educate:start — the installer

This skill stamps out a **learning project**: a folder whose own `CLAUDE.md` carries the
always-on orchestration rules, plus the scaffolding every lesson needs. It is the answer
to "a plugin has no always-on slot" — instead of bundling always-on context, the plugin
*plants* a project `CLAUDE.md`, which is always-on for free.

It works in two modes, decided in step 2: a **fresh install** into an empty folder, and an
**update** that migrates an already-set-up project to the current plugin version (rename
legacy scaffolding, refresh the boilerplate) without disturbing any real lesson. Re-running
`educate:start` after a plugin upgrade is the supported way to bring a project current.

## What it does NOT do
- It does **not** copy `progress.mjs` into the project. That script lives in the plugin and
  is run as `${CLAUDE_PLUGIN_ROOT}/scripts/progress.mjs --root <projectRoot> <topic>`.
  Installing once and referencing keeps every project on the same, updatable tool.

## Steps (fresh install)

1. **Pick the project folder.** Ask the user where the learning project should live
   (default: the current working directory). Call it `<root>`.

2. **Detect the mode.** Look at `<root>`:
   - Neither `CLAUDE.md` nor `topics/` exists → **fresh install**: continue with steps 3–6.
   - Either already exists → this folder is already a project. Do **not** clobber it; switch
     to **Update an existing project** below.

3. **Plant the always-on layer.** Copy `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md` to
   `<root>/CLAUDE.md`. This is the file that makes the lifecycle, placement rules, and
   Definition of Done apply on every session in this project.

4. **Plant the scaffolding:**
   - `${CLAUDE_PLUGIN_ROOT}/templates/.template/`  ->  `<root>/topics/.template/`
     (dot-prefixed: hidden scaffolding, not a lesson)
   - `${CLAUDE_PLUGIN_ROOT}/templates/progress.schema.json`  ->  `<root>/topics/progress.schema.json`
     (NOT hidden — it is referenced directly by its `$id` URL, so keep the plain name)
   Copy `.template/` with a tool that preserves dotfiles (e.g. `cp -R`); some copy helpers
   skip names beginning with `.`, which would silently drop the template.

5. **Verify.** List `<root>` (including dotfiles, e.g. `ls -a topics/`) and confirm `CLAUDE.md`,
   `topics/.template/checklist.md`, `topics/.template/raw-notes.md`, and
   `topics/progress.schema.json` all exist on disk.
   Report what was created; never claim success without listing the files.

6. **Hand off.** Tell the user the project is ready and that the next move is
   `educate:lesson` (or `/teach-me`) to start lesson 101 of their first topic.

## Update an existing project (migrate to the current version)
Run this when `<root>` is already a project (step 2 sent you here) — typically right after
upgrading the plugin. It is **idempotent**: safe to re-run, and a no-op once current. The job
is to bring the *scaffolding* up to date while leaving every *real lesson* exactly as it is.

1. **Migrate legacy names** (only the ones that still exist):
   - `topics/_template/`  ->  `topics/.template/`  (use `git mv` in a repo, else `mv`)
   - `topics/_progress.schema.json`  ->  `topics/progress.schema.json`
   If the current-named target already exists, that rename is already done — skip it.

2. **Refresh the planted boilerplate** from the plugin to the current version. These are
   scaffolding, not lesson content, so overwriting is the correct move:
   - `${CLAUDE_PLUGIN_ROOT}/templates/.template/`  ->  `<root>/topics/.template/`  (overwrite; `cp -R` to keep dotfiles)
   - `${CLAUDE_PLUGIN_ROOT}/templates/progress.schema.json`  ->  `<root>/topics/progress.schema.json`  (overwrite)

3. **Reconcile `CLAUDE.md`.** It is planted boilerplate, but the user may have edited it. Diff
   `<root>/CLAUDE.md` against `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md`; if they differ, show
   the user what would change and confirm before overwriting. Carry forward any project-specific
   additions — never silently discard them.

4. **Leave real lessons alone.** Lesson folders (`topics/<topic>/NNN-*`), their `progress.json`,
   `SERIES.md`, and any already-built `deck.html`/`guide.md` are the user's work product — do not
   touch them. The refreshed `.template/` (new note-taking structure, new deck template) governs
   **future** lessons only; existing decks remain as built and serve as style references.

5. **Verify & report.** `ls -a topics/` and confirm the legacy `_template/` /
   `_progress.schema.json` are gone and `.template/` + `progress.schema.json` are present and
   current. Report exactly what was renamed, refreshed, reconciled, and deliberately left untouched.

## After install / update
The live workflow now lives in `<root>` (its `CLAUDE.md` governs). The plugin's job here is
done — it was the factory, not the factory floor.
