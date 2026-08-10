---
id: TASK-106
title: 'pdlc: config-driven model tiers — Opus/Fable thinks, Sonnet/Haiku executes'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-10 13:24'
updated_date: '2026-08-10 13:24'
labels:
  - pdlc
  - pdlc-sweep
  - doctrine
dependencies: []
priority: high
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The PDLC model-tier ladder is hardcoded doctrine in three surfaces that drift apart: the planted `pdlc/templates/CLAUDE.md` table, `.claude/agents/opus-implementer.md` (which pins the FALLBACK claude-opus-4-8 while citing the never-inherit ruling), and `docs/wiki/pdlc-plugin.md:71` prose.

Two problems:
1. The default posture is backwards for cost — Opus is the default implementer, Sonnet the exception. Intended: thinking is Opus/Fable, execution is Sonnet/Haiku, with Opus as operator-gated escalation only.
2. Model IDs live in prose, and prose rots. Haiku/Sonnet/Opus/Fable rev on independent cadences and new families arrive unannounced. Every rev today = three edits (drift-gated planted table + agent def + wiki note), three chances to hallucinate an ID.

Design: `.claude/model-tiers.json` becomes the single hand-editable source; a new generator `pdlc/scripts/tiers.mjs` writes `.claude/agents/<tier>-implementer.md` from it. The generator is required because the harness honors exactly one pin — `model:` in agent-def frontmatter — and was observed on 2026-07-31 silently ignoring the dispatch-call `model` param (docs/design/board-cost-test-runbook.md, TASK-74 row, ~2x unit price). Chain: config → generator → agent def → harness.

The planted CLAUDE.md tier section stops carrying model IDs (keeps the posture + pin-provenance paragraph) and points at the config, so bumping a model ID stops being a bootstrap re-plant.

Subsumes TASK-97 AC #1 and #2 (agent-def dispatch mechanism + primary-vs-fallback provenance).

Model IDs resolved against the claude-api skill, per the never-author-from-memory rule in pdlc/skills/bootstrap/SKILL.md:122-125.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `.claude/model-tiers.json` schema supports an OPEN tier map (a tier key the repo never anticipated, e.g. fable, generates a valid agent def), per-tier `fallback`, and `escalation: true`
- [ ] #2 `pdlc/scripts/tiers.mjs` generates agent defs from config with plant.mjs report vocabulary (created|unchanged|drifted|replaced); a hand-edited def reports drifted and is never overwritten without --force
- [ ] #3 Unknown `defaultTier`/`escalationTier` fails with a NAMED error, never a silent skip
- [ ] #4 Planted CLAUDE.md tier section carries posture + config pointer + the pin-provenance paragraph, and no hardcoded model IDs
- [ ] #5 bootstrap SKILL.md plants the config and generates the defs (inverting the current operator-authors-them clause); two-doors section names config-edit-then-regenerate as door 2
- [ ] #6 sweep SKILL.md Phase 1 item 2 reads tiers from config, defaults to defaultTier, and requires a recorded operator checkpoint for an escalation tier; step 5 teaches agent-def pinning + served-model verification (TASK-97 AC#1)
- [ ] #7 This repo dogfoods: .claude/model-tiers.json planted, three agent defs regenerated (opus corrected to claude-opus-5 primary with claude-opus-4-8 fallback — TASK-97 AC#2), root CLAUDE.md re-planted
- [ ] #8 Live dispatch proof: a dispatch to the regenerated sonnet-implementer is confirmed from the transcript to have been served by claude-sonnet-5
- [ ] #9 docs/wiki/pdlc-plugin.md and pdlc-sweep.md amended NEEDS-REVIEW (not stamp-only) in the same PR
- [ ] #10 Version bumps: marketplace/plugin 0.54.0->0.55.0, bootstrap SKILL 0.10.0->0.11.0, sweep SKILL 0.18.0->0.19.0
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build `pdlc/scripts/tiers.mjs` (dual-use library+CLI, modeled on plant.mjs) + `pdlc/templates/model-tiers.json` + `pdlc/templates/implementer-agent.md`.
2. Rewrite `pdlc/templates/CLAUDE.md` `## Model tiers` — posture + config pointer, drop hardcoded IDs, keep the pin-provenance paragraph (test/pdlc.test.mjs:156-170 asserts it).
3. Rewrite bootstrap SKILL.md (plant config + generate defs; invert the operator-authors-them clause; two-doors -> door 2 is config-edit + regenerate) and sweep SKILL.md (Phase 1 item 2 reads config; step 5 fixes the dispatch-param instruction per TASK-97).
4. Extend `test/pdlc.test.mjs` (not a new file — TASK-103 has the catalog hub at 7987/8000): schema validation named errors, open-tier extensibility (fable), model pin fidelity, --check exit codes, drift protection.
5. Dogfood: `.claude/model-tiers.json`, regenerate three agent defs, re-plant root CLAUDE.md, bump versions (marketplace/plugin 0.55.0, bootstrap 0.11.0, sweep 0.19.0).
6. Live dispatch proof: dispatch to the regenerated sonnet-implementer, confirm claude-sonnet-5 served it from the transcript.
7. Wiki re-pin as a FINAL docs-only commit (after the commits that touched pinned sources), then PR with a merge commit (never squash).

Worktree: `.worktrees/task-106` on branch `task-106-model-tier-config` off origin/main. Root stays on main.
<!-- SECTION:PLAN:END -->
