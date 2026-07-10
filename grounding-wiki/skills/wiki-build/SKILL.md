---
name: wiki-build
version: 0.1.0
description: Generate a code-grounded corpus (docs/wiki) for a codebase — per-concept MD notes pinned to the current commit, interlinked and indexed, passing the freshness gate. Use when the user wants a grounding wiki, a queryable knowledge base for a repo, or says "build a wiki for this codebase" / "ground this repo".
---

# wiki-build — generate a grounding wiki from a codebase

Produces a **grounded corpus** (see `docs/corpus-spec.md` in the praxis repo; the plugin's
`templates/note.md` is the note shape) at `docs/wiki/` in the target repo: one note per
concept/component, each pinned to the commit it was verified against and listing the source
files whose change invalidates it.

## Precondition gate

- The target must be a git repo with a clean-enough tree to pin: run
  `git rev-parse HEAD` — this hash is the pin for every note written in this pass.
- If `docs/wiki/INDEX.md` already exists, STOP: this is an update job — use the
  `wiki-update` skill instead.

## Work

1. **Survey the codebase** (README, entry points, package layout) and draft the note list:
   one note per concept — components, pipelines, cross-cutting patterns, config. Typical
   repo: 15–25 notes. Write `INDEX.md` first (grouped one-liners; it doubles as your plan).
2. **Write an `overview` note** yourself — the system's shape, data planes, entry points.
3. **Write the remaining notes** (parallel subagents are fine for >10 notes; group by
   subsystem). For every note:
   - READ the actual source before writing; the code is ground truth, not docs or comments.
   - Follow `templates/note.md`: frontmatter `name`/`description`/`kind`/`sources:`/
     `verified_against: <the pin>`, then Title / How it works / Connections / Operational notes.
   - Neutral, factual tone. File paths + symbol names, never line numbers. Short verbatim
     snippets only where load-bearing. 40–90 lines. `[[links]]` only to notes on the list.
   - `sources:` lists every file whose change should invalidate the note — no more, no less.

## Output gate

Run `node ${CLAUDE_PLUGIN_ROOT}/gates/cli.mjs freshness <repo-root> docs/wiki` — must exit 0
(all notes pinned + fresh, all `[[links]]` resolving; warnings are yours to judge).

## Handing off

Tell the user what's now possible: ask grounded questions against the wiki, keep it honest
with `wiki-update` when code changes, wire the gate into CI/hooks as a pre-merge check, or
consume it downstream (courses, lessons, reference-repo ingestion). Don't do those here.
