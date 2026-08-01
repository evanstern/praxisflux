---
id: TASK-91
title: 'pdlc:bootstrap plants no model-tier rubric, but pdlc:sweep hard-requires one'
status: Done
assignee:
  - '@claude'
created_date: '2026-08-01 04:29'
updated_date: '2026-08-01 18:11'
labels:
  - pdlc
  - pdlc-sweep
  - doctrine
dependencies: []
priority: medium
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A project bootstrapped for the PDLC has nothing that says which model does what — yet the sweep refuses to dispatch without exactly that. The gap is invisible until a sweep is already running, and the failure mode is silent: dispatches fall back to whatever model the orchestrator happens to be on.

As an operator who just ran pdlc:bootstrap on a fresh repo, I want the lifecycle to tell me it expects a model-tier rubric, so I find out at bootstrap time rather than three tasks into my first sweep.

As a sweep orchestrator authoring a runbook, I want somewhere defined to read the tier rubric from, so 'model tier per task, from the host project's rubric' resolves to a real artifact instead of my own judgement.

As the operator paying the bill, I want an absent rubric to be loud, because the silent path is the expensive one — the sweep skill already documents the field case where 'Opus tier' implementers ran on the orchestrator's Fable session model at 2x the unit price.

Evidence:
- pdlc/skills/sweep/SKILL.md:96-105 requires 'model tier per task, from the host project's rubric (e.g. a constitution's tiered-workflow principle)' plus an explicit model ID and a fallback ID per task; SKILL.md:195-201 requires the runbook's pinned model ID to be passed at dispatch. Both treat the host rubric as a given.
- pdlc/skills/bootstrap/SKILL.md contains no mention of tiers, models, or a rubric — rg -i 'tier|rubric' returns nothing. Bootstrap plants the PDLC CLAUDE.md block, gitignores .handoff/, and handles Backlog.md + Spec Kit; model tiering is not part of the grounding it stamps.
- Consequence: on a bootstrapped-but-not-hand-authored project, sweep's Phase 1 item 2 has no source. Nothing gates it, so the runbook gets a bare tier name or none, and SKILL.md's own warning ('a bare tier name is not a valid runbook entry') is the only thing standing between the operator and an unpinned dispatch.

Related field evidence worth folding into whatever bootstrap plants: on 2026-07-31 the Agent tool's model parameter was observed to be silently ignored in this harness (board-cost-test runbook, TASK-74 row: 'Agent tool model param silently ignored, 3 fable dispatches killed early; pinned via .claude/agents/opus-implementer.md'). If bootstrap teaches tier pinning, it should teach frontmatter-pinned agent definitions with explicit model IDs, not the model parameter.

Spec: specs/048-bootstrap-tier-rubric
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 pdlc:bootstrap either plants a model-tier rubric stub in the grounding it stamps, or detects an absent rubric and tells the operator what to author and where — the choice recorded with its rationale
- [x] #2 Whatever bootstrap teaches names the pinning mechanism that actually holds: an explicit model ID in an agent definition's frontmatter, citing the 2026-07-31 field case where the dispatch-call model parameter was silently ignored
- [x] #3 pdlc:sweep's Phase 1 item 2 names where the rubric is expected to live for a bootstrapped project, so 'the host project's rubric' resolves to a defined location
- [x] #4 A test in test/pdlc.test.mjs pins the new bootstrap contract, matching the existing plugin test standard
- [x] #5 Spec phase: Plant the rubric
- [x] #6 Spec phase: Teach it in bootstrap
- [x] #7 Spec phase: Point sweep at it
- [x] #8 Spec phase: Pin the contract in tests
- [x] #9 Spec phase: Re-plant, bump, re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch record (pdlc:sweep; runbook docs/design/bootstrap-tier-rubric-runbook.md, signed-off 2026-08-01).

Tier: default implementer. Model ID: claude-opus-4-8, dispatched via the frontmatter-pinned .claude/agents/opus-implementer.md agent def — NOT the Agent tool's model param, which was observed silently ignored in this harness on 2026-07-31. Fallback: claude-opus-5 if the subscription surfaces it. Served model recorded per dispatch.

Rubric justification: cross-surface doctrine prose with a genuine design choice (what bootstrap plants, and where sweep reads it from), touching two skill contracts, a planted always-on template, this repo's own planted block, and a test pinning the new contract. No mechanical pattern to copy, so not the sonnet mechanical tier.

Operator rulings at sign-off (2026-08-01), carried as runbook gate lines: (A) the rubric's model IDs are resolved against what the system actually exposes, never authored from memory; (B) refreshing the rubric later must be quick and easy, and spec.md must name the refresh path; (C) planted defaults are latest-generation — claude-opus-5 primary, claude-sonnet-5 mechanical, claude-opus-4-8 documented fallback.

Spec: specs/048-bootstrap-tier-rubric claimed in this branch's first commit (stub only until the real spec/plan/tasks land).

spec-bridge sync: Plant the rubric: 7/7 · Teach it in bootstrap: 6/6 · Point sweep at it: 5/5 · Pin the contract in tests: 7/7 · Re-plant, bump, re-ground: 9/9 — status In Progress → Done. Landed as PR #122 (merge 10bff49), marketplace v0.52.0. The card ACs #1-#4 are checked here alongside the bridge-derived phase ACs: the design choice and its rationale are recorded in specs/048-bootstrap-tier-rubric/spec.md, the frontmatter-pinning mechanism and its 2026-07-31 citation are in the planted template section, sweep Phase 1 item 2 names the location, and test/pdlc.test.mjs carries the contract assertions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Plant the rubric: 7/7 · Teach it in bootstrap: 6/6 · Point sweep at it: 5/5 · Pin the contract in tests: 7/7 · Re-plant, bump, re-ground: 9/9). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
