---
id: TASK-106
title: 'pdlc: config-driven model tiers — Opus/Fable thinks, Sonnet/Haiku executes'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-10 13:24'
updated_date: '2026-08-10 13:54'
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
- [x] #1 `.claude/model-tiers.json` schema supports an OPEN tier map (a tier key the repo never anticipated, e.g. fable, generates a valid agent def), per-tier `fallback`, and `escalation: true`
- [x] #2 `pdlc/scripts/tiers.mjs` generates agent defs from config with plant.mjs report vocabulary (created|unchanged|drifted|replaced); a hand-edited def reports drifted and is never overwritten without --force
- [x] #3 Unknown `defaultTier`/`escalationTier` fails with a NAMED error, never a silent skip
- [x] #4 Planted CLAUDE.md tier section carries posture + config pointer + the pin-provenance paragraph, and no hardcoded model IDs
- [x] #5 bootstrap SKILL.md plants the config and generates the defs (inverting the current operator-authors-them clause); two-doors section names config-edit-then-regenerate as door 2
- [x] #6 sweep SKILL.md Phase 1 item 2 reads tiers from config, defaults to defaultTier, and requires a recorded operator checkpoint for an escalation tier; step 5 teaches agent-def pinning + served-model verification (TASK-97 AC#1)
- [x] #7 This repo dogfoods: .claude/model-tiers.json planted, three agent defs regenerated (opus corrected to claude-opus-5 primary with claude-opus-4-8 fallback — TASK-97 AC#2), root CLAUDE.md re-planted
- [ ] #8 Live dispatch proof: a dispatch to the regenerated sonnet-implementer is confirmed from the transcript to have been served by claude-sonnet-5
- [ ] #9 docs/wiki/pdlc-plugin.md and pdlc-sweep.md amended NEEDS-REVIEW (not stamp-only) in the same PR
- [x] #10 Version bumps: marketplace/plugin 0.54.0->0.55.0, bootstrap SKILL 0.10.0->0.11.0, sweep SKILL 0.18.0->0.19.0
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Generator slice landed (1558fd1). `pdlc/scripts/tiers.mjs` + `pdlc/templates/model-tiers.json` + `pdlc/templates/implementer-agent.md`.

Verified by hand before commit:
- open tier map: added a `fable` key to a scratch config, generated a valid `fable-implementer.md` pinned to claude-fable-5 with no code change (AC#1)
- report vocabulary matches plant.mjs; hand-edited def reports `drifted` and survives untouched; `--force` replaces it (AC#2)
- all 9 schema rejections are named errors at exit 2: unknown defaultTier/escalationTier, missing defaultTier, tier without model, tier without `for`, empty tiers, bad tier name, invalid JSON, missing config file (AC#3)

Design note beyond the plan: drift now exits **nonzero in write mode too**, not just under `--check`. A drifted def means that tier's pin disagrees with the config and this run did not fix it; exiting 0 there would report success over a live config/pin mismatch — the same silent state the whole mechanism exists to prevent.

AC#8 (live dispatch proof) FAILED on first run and found three real defects. This is the AC earning its place — a green `--check` would have shipped all three.

**Finding 1 — model IDs are host-form, not bare API IDs.** Dispatch to the regenerated `sonnet-implementer` (pinned `claude-sonnet-5`, straight from the claude-api skill) failed: "There's an issue with the selected model (claude-sonnet-5)." The `sonnet` alias failed identically. Yet `Agent(model: sonnet)` resolved fine to `cc/claude-sonnet-5[1m]`. Cause: this checkout routes through **9router** (ANTHROPIC_BASE_URL -> 127.0.0.1:20128), which augments model names and requires the `cc/` prefix + `[1m]` suffix. Operator ruling: config carries the host's accepted form; the plugin template keeps bare IDs as the portable default; bootstrap gains a resolve-the-host's-FORM step. This is itself the argument for host-level config over plugin doctrine.

**Finding 2 — the 2026-07-31 ruling is not universal.** That ruling says the dispatch-call `model` param is silently ignored and the agent-def frontmatter pin is what holds. Here the **inverse** held: the param worked, the frontmatter pin was rejected. Operator ruling: record both field cases, keep the frontmatter pin as preferred (durable across sessions vs per-call), and make **served-model verification** the load-bearing rule rather than either mechanism. Doctrine no longer claims either one always works.

**Finding 3 — the agent registry is read at session start.** `haiku-implementer` (newly generated, on disk) dispatched as "agent type not found"; `opus-implementer` dispatched reporting `claude-opus-4-8[1m]` — its **pre-regeneration** pin — while the file on disk already said `claude-opus-5`. So regenerate + dispatch in one session silently uses stale pins. Now doctrine in the planted block and bootstrap, plus a sweep precondition (regenerating mid-sweep requires ending the session before dispatching, or the lane runs at the old price).

AC#8 stays UNCHECKED: a dispatch to a def carrying the host-form pin cannot be proven until this session restarts (Finding 3). The pins are correct on disk and `tiers.mjs --check` is green; the transcript proof is owed after restart.
<!-- SECTION:NOTES:END -->
