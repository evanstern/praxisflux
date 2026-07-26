---
id: TASK-53
title: 'pdlc plant.mjs: absent-peer behavior needs a deterministic trace'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-26 17:47'
updated_date: '2026-07-26 19:54'
labels:
  - pdlc
  - dogfood
dependencies: []
priority: low
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-43 dogfood finding #1 (specs/010-bootstrap-dogfood/tasks.md T005): the deterministic planter is peer-silent — omitting --peer spec-kit simply strips the peer block with no warning, recommendation, or record; all absent-peer behavior (detect via command -v specify, recommend install, offer to wait) lives only in pdlc/skills/bootstrap/SKILL.md prose, i.e. agent judgment with no verifiable trace. Observed consequence: a host keeping hand-authored specs/NNN-* dirs gets grounded with no Spec Kit block and no notice that the specs convention lives nowhere in the planted grounding. Make the absence observable deterministically — e.g. plant.mjs records absent-at-plant-time peers in the .pdlc sentinel and/or emits a stderr notice naming the skipped peer blocks, so the recommend-when-absent contract has an artifact.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 plant.mjs leaves a deterministic trace of peers considered and omitted (sentinel field and/or stderr notice), covered by tests
- [ ] #2 bootstrap SKILL.md references the trace instead of relying on untraceable judgment
- [ ] #3 Versions bumped per docs/releasing.md (pdlc released surface)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 016-plant-peer-trace (hand-authored)
2. spec-bridge:link
3. Dispatch: plant.mjs records peers considered/omitted deterministically (sentinel field + stderr notice), tests; bootstrap SKILL.md references the trace
4. Versions (bootstrap skill + marketplace); wiki re-pin pdlc-plugin; PR; serial merge (TASK-54 follows in Lane 2 on the same files)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 1 (docs/design/lane-hardening-runbook.md). Tier: default implementer. From TASK-43 dogfood finding #1.
<!-- SECTION:NOTES:END -->
