---
id: TASK-0134
title: >-
  AGENTS.md becomes the load-bearing planted file — CLAUDE.md degrades to a thin
  @AGENTS.md pointer so the grounding works in harnesses other than Claude Code
status: To Do
assignee: []
created_date: '2026-09-20 01:59'
labels:
  - pdlc
  - educate
  - research
  - feature
dependencies: []
priority: high
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`plant.mjs` hardcodes `<root>/CLAUDE.md` as the target of the always-on grounding block (`pdlc/scripts/plant.mjs:232`; template `pdlc/templates/CLAUDE.md`; required-artifact check at `:291`). That was right when praxisflux was a Claude Code plugin marketplace and Claude Code was the only harness. It is now the thing that pins the whole lifecycle to one harness: Codex, Cursor, Copilot, Gemini CLI, Warp, Zed, opencode and the rest read `AGENTS.md` and never look at `CLAUDE.md`, so a PDLC-planted project hands them nothing. What they are missing is exactly the load-bearing part — the loop, the rules that always hold, the model-tier doctrine, the peer blocks — and the failure is silent: no warning, no error, just an agent that does not know the rules.

Make `AGENTS.md` the load-bearing planted file. The grounding block, its markers, and the peer blocks move there; `CLAUDE.md` degrades to a thin pointer whose content is the `@AGENTS.md` import plus anything genuinely Claude-specific. That shape is Anthropic's own documented bridge and it is the portable one: it holds on every Claude Code version, on Bedrock/Vertex/Foundry, and on Windows checkouts — where the symlink alternative fails silently under `core.symlinks=false`. Claude Code v2.1.277 (2026-09-18) did add an AGENTS.md fallback, but only when `CLAUDE.md` is absent, it is toggleable in `/config`, and it is not supported on those three providers. Too conditional to be the mechanism a load-bearing file rests on.

The blast radius is wider than the write target. The drift/consent machinery keys on the CLAUDE.md path (`extractBlock`, the `.pdlc` sentinel, `--check`/`--force`). `educate:start` and `research:research-vault` plant their own project CLAUDE.md from their own templates. And praxisflux's own root `CLAUDE.md` is read by `scripts/check-docs.mjs:31`, enforced by the pre-commit/pre-push hooks, CI, and the repo Stop hook, cited as a source by `.specify/memory/constitution.md`, and named in the root-guard hook's blocking messages. One thing is already done: `excludeSet` lists `/AGENTS.md` (`pdlc/scripts/plant.mjs:60`, spec 060 R2), so local-only planting needs no new exclude line — it anticipated this.

Already-planted hosts migrate on re-plant: the marked block moves to `AGENTS.md`, the pointer is left in its place, and the move surfaces through the sentinel as honest drift needing consent (`--force`) — the same path a drifted block and a mode switch already take. Moving it silently would strand the block in a file the new pointer no longer carries.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pdlc plants the grounding block (markers, peer blocks, tier section) into <root>/AGENTS.md; the rendered content is byte-identical to what CLAUDE.md carried, and AGENTS.md is a required artifact in the plant report's missing check
- [ ] #2 CLAUDE.md is planted as a thin pointer whose first directive is the @AGENTS.md import; content a project has added below the pointer survives a re-plant untouched
- [ ] #3 Drift and consent operate on the new target: extractBlock, --check, and --force key on AGENTS.md, and an unconfirmed drift still refuses to advance the .pdlc sentinel
- [ ] #4 An already-planted host migrates on re-plant: the block moves from CLAUDE.md to AGENTS.md and the pointer replaces it, reported as honest drift needing consent rather than performed silently
- [ ] #5 Local-only planting still leaves git status clean on a first plant and the excludes-before-artifacts ordering holds; the exclude set needs no new line because /AGENTS.md is already in it
- [ ] #6 pdlc:bootstrap teaches the AGENTS.md-first shape and the pointer's purpose, and its report names both files and which one is load-bearing
- [ ] #7 educate:start and research:research-vault plant AGENTS.md plus the pointer on the same pattern, from their own templates
- [ ] #8 praxisflux's own root is migrated (dogfood): AGENTS.md carries the content, CLAUDE.md is the pointer, and scripts/check-docs.mjs plus the hooks, CI, and the repo Stop hook check the load-bearing file
- [ ] #9 Every prose reference that names CLAUDE.md as the always-on file is corrected: README.md, docs/principles.md, docs/skill-patterns.md, the constitution's source citations, and the root-guard hook's blocking messages
- [ ] #10 Tests pin the behavior: planting target, pointer content, drift and consent on the new path, migration of an existing plant, and the cross-plugin planters
- [ ] #11 Wiki re-pinned for every note whose sources this change touches; marketplace version and each edited skill version bumped; gates green
<!-- AC:END -->
