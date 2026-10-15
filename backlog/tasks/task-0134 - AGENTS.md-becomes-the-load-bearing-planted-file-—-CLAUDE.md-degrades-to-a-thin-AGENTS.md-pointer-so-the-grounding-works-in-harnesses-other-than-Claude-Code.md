---
id: TASK-0134
title: >-
  AGENTS.md becomes the load-bearing planted file — CLAUDE.md degrades to a thin
  @AGENTS.md pointer so the grounding works in harnesses other than Claude Code
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-20 01:59'
updated_date: '2026-10-15 17:51'
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

Spec: specs/074-agents-md
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
- [ ] #12 Spec phase: Phase 1 — plant.mjs plants AGENTS.md with a CLAUDE.md pointer
- [ ] #13 Spec phase: Phase 2 — repo tooling follows the load-bearing file
- [ ] #14 Spec phase: Phase 3 — dogfood this repo, and bootstrap teaches it
- [ ] #15 Spec phase: Phase 4 — cross-plugin planters and prose (haiku-suitable)
- [ ] #16 Spec phase: Phase 5 — release, re-ground, gates
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Spec 074 authored (spec/plan/tasks). Open checkpoints for operator: OC1 release size (plan takes minor 0.67.0; releasing.md calls planted-file schema changes major); OC2 explainer's own CLAUDE.md planter (explainer/scripts/explainer.mjs:337-343) is out of card scope — recommend a follow-up card or TASK-0139.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5

Phase 3 (dogfood + bootstrap teaches it): node pdlc/scripts/plant.mjs --root . --peer backlog --force migrated the root block (agentsMd: created, claudeMd: migrated); hand-moved the orientation prose + Backlog.md guidelines block from CLAUDE.md into AGENTS.md above the BEGIN marker (byte-identical move, verified via diff of before/after against the original pre-migration CLAUDE.md); CLAUDE.md is now exactly "@AGENTS.md\n". backlog targets AGENTS.md finding (read via `backlog agents --help` + strings on the installed darwin-arm64 binary, backlog.md 1.47.1 at /opt/homebrew/Cellar/backlog-md/1.47.1): `backlog agents --update-instructions` treats CLAUDE.md and AGENTS.md as two SEPARATE, independently selectable instruction-file targets (map includes claude:CLAUDE.md, agents/cursor/codex:AGENTS.md, gemini:GEMINI.md, copilot:.github/copilot-instructions.md) — it does not follow a CLAUDE.md-to-AGENTS.md pointer; each selected file gets its own managed <!-- BACKLOG.MD GUIDELINES START/END --> block (file-agnostic marker text, confirmed in the binary). So our hand-moved guidelines block in AGENTS.md is exactly what a future `backlog agents --update-instructions` run against AGENTS.md would refresh if AGENTS.md is (re-)selected as a target; nothing automatic links it to the old CLAUDE.md selection. Verified: plant.mjs --root . --peer backlog --check exit 0; check-docs.mjs exit 0 ("README.md and AGENTS.md are in sync with the repo"); sync-version.mjs --check exit 0; node --test full suite 1244/1244 pass. Updated pdlc/skills/bootstrap/SKILL.md (version 0.13.1 -> 0.14.0) to teach the AGENTS.md-first shape, the pointer's purpose, the migration path, and an Output gate that verifies AGENTS.md's markers plus CLAUDE.md's pointer line; updated pdlc/README.md to match. No deviations from plan.md's dogfood ordering.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5
Orchestrator verification (phase 3): AGENTS.md pre-block text byte-identical to origin/main CLAUDE.md's (7398 bytes); grounding block identical except two trailing blank lines after END dropped by plant --force; CLAUDE.md is exactly '@AGENTS.md\n'.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5
Phase 4 open items for operator: explainer planter left in CLAUDE.md pending OC2; educate/skills/lesson/SKILL.md has two generic 'project CLAUDE.md' mentions not in the Phase 4 list. Phase 5 held pending OC1 (release size).

Operator rulings 2026-10-15: OC1 release 1.0.0 (major); OC2 explainer planter moves to AGENTS.md in this PR; constitution v1.0.1 signed off; claudeMd report-field meaning change accepted; leftover prose (educate lesson SKILL.md + root orientation) swept in this PR. Spec set amended: new Phase 4b, Phase 5 targets 1.0.0.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5
Phase 4b: explainer plant consent-gates only the legacy CLAUDE.md migration; in-AGENTS.md refresh stays unconditional as before (deviation note in plan.md).
<!-- SECTION:NOTES:END -->
