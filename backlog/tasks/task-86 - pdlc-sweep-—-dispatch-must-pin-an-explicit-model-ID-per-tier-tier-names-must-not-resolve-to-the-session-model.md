---
id: TASK-86
title: >-
  pdlc:sweep — dispatch must pin an explicit model ID per tier (tier names must
  not resolve to the session model)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-30 18:32'
updated_date: '2026-07-30 19:04'
labels:
  - sweep-cost
  - pdlc-sweep
dependencies: []
references:
  - >-
    docs/design/ (sweep cost analysis: promptworld session b129d47c
    sweep-dat-board)
priority: high
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cost analysis of the sweep-dat-board run (promptworld session b129d47c, 2026-07-29→30, $1,192.57 total) found that implementer subagents dispatched as 'Opus tier' actually ran on claude-fable-5 ($10/$50 per MTok) because dispatch inherits the orchestrator session's model. Fable carried $967 of $1,192 (81%). Opus 5 is $5/$25 — the same tier intent at half the unit price. The runbook's tier rubric is judgment; the tier→model resolution must be mechanical: sweep SKILL.md step 5 (dispatch) and the runbook template must record and pass an explicit model ID per tier, never a bare tier name. Estimated impact on a comparable sweep: ~\$450-480 saved with zero behavior change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pdlc/skills/sweep/SKILL.md Phase 1 item 2 (model tier per task) requires the runbook to record an explicit model ID next to each tier label
- [ ] #2 SKILL.md step 5 (dispatch) instructs the orchestrator to pass that model ID explicitly to the implementer agent (e.g. Agent tool model param), never relying on session-model inheritance
- [ ] #3 templates/runbook.md has a slot for tier AND model id per task
- [ ] #4 Marketplace version and sweep skill version bumped per docs/releasing.md
<!-- AC:END -->
