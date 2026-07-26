---
id: TASK-53
title: 'pdlc plant.mjs: absent-peer behavior needs a deterministic trace'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-26 17:47'
updated_date: '2026-07-26 20:10'
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

Spec: specs/016-plant-peer-trace
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 plant.mjs leaves a deterministic trace of peers considered and omitted (sentinel field and/or stderr notice), covered by tests
- [x] #2 bootstrap SKILL.md references the trace instead of relying on untraceable judgment
- [x] #3 Versions bumped per docs/releasing.md (pdlc released surface)
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
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

Implemented: .pdlc sentinel gains peersOmitted (known peers not opted in, deterministic order); plant emits a one-line stderr notice per omitted peer naming the stripped block; idempotence + legacy-sentinel tolerance proven by tests (3 new, house style); bootstrap SKILL.md recommend-when-absent now points at the trace and the output gate verifies declined peers under peersOmitted. bootstrap 0.4.0, marketplace 0.23.0. pdlc-plugin note re-verified (trace section, trimmed back under the 8000 budget); 11 lockstep re-pins honest. 204 tests, check-docs, wiki-freshness, bump gate green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The planter's absent-peer behavior now has a deterministic trace: .pdlc records peersOmitted (known peers not opted in at plant time) and the CLI notices once per omitted peer on stderr, naming the stripped block — so the recommend-when-absent contract finally has an artifact instead of untraceable prose. Idempotence and legacy-sentinel tolerance hold by test. bootstrap 0.4.0, marketplace 0.23.0. Closes TASK-43 dogfood finding #1; finding #2 is TASK-54, next lane on the same files.
<!-- SECTION:FINAL_SUMMARY:END -->
