---
id: TASK-33
title: 'P2 refinements: reason-to-approve test + the EPIC tier in docs/principles.md'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-17 14:36'
updated_date: '2026-07-26 14:16'
labels: []
dependencies: []
priority: medium
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up to TASK-32 (merged as PR #47): two owner refinements were ratified in the Coda session while TASK-32 was mid-flight and are recorded in TASK-32's implementation notes, but docs/principles.md P2 does not yet carry them: (1) the reason-to-approve test; (2) the EPIC tier completing the three-tier model. Worked example + downstream restatement already exist in Coda (TASK-0003 restructure; constitution-amendment PR #9 citing docs/principles.md as upstream). Reason to approve: ratifying an amendment to canonical methodology text every pdlc-bootstrapped project inherits.

Spec: specs/008-principles-p2-refinements
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 P2 in docs/principles.md states the reason-to-approve test as part of the TASK definition
- [ ] #2 P2 states the three-tier model (EPIC groups / TASK = 1 PR / SUBTASK never a PR), task-system-agnostically
- [ ] #3 The pdlc bootstrap grounding block reflects the refinements if it restates P2
- [ ] #4 Wiki notes sourcing docs/principles.md re-pinned
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 008-principles-p2-refinements (hand-authored)
2. spec-bridge:link
3. Dispatch: fold the two TASK-32-ratified refinements into docs/principles.md P2 — reason-to-approve test + the EPIC tier (EPIC groups TASKs, no PR; TASK = one deliverable one PR; SUBTASK never a PR); sync the pdlc template's stamped principles region (test-asserted)
4. Wiki re-pins as flagged; version bump if template touched; course per policy in force at merge; PR; serial merge
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 1 (docs/design/board-clearing-runbook.md). Tier: default implementer (canonical prose amendment, small).
<!-- SECTION:NOTES:END -->
