---
id: TASK-33
title: 'P2 refinements: reason-to-approve test + the EPIC tier in docs/principles.md'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-17 14:36'
updated_date: '2026-07-26 14:26'
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
- [x] #1 P2 in docs/principles.md states the reason-to-approve test as part of the TASK definition
- [x] #2 P2 states the three-tier model (EPIC groups / TASK = 1 PR / SUBTASK never a PR), task-system-agnostically
- [x] #3 The pdlc bootstrap grounding block reflects the refinements if it restates P2
- [x] #4 Wiki notes sourcing docs/principles.md re-pinned
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
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

Implemented: P2 gains the reason-to-approve test + the EPIC tier (three-tier model, task-system-agnostic); pdlc template's One-TASK-one-PR rule restated the tier model so it was synced (EPIC sentence + compact reason-to-approve line); bootstrap 0.3.0, marketplace 0.16.0; 11 wiki notes re-pinned to 287b6b0 (pdlc-plugin re-verified substantively, 10 stamp-only from the lockstep bump). 167 tests, check-docs, wiki-freshness, bump gate green. Course deferred: merging after TASK-41 under the per-feature policy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
docs/principles.md P2 now carries both TASK-32-ratified refinements: the reason-to-approve test (a PR exists only where it gives a human a stated reason to approve; too-small items merge into the deliverable they serve) and the EPIC tier completing the task-system-agnostic three-tier model (EPIC groups TASKs, no PR; TASK = one deliverable one PR; SUBTASK never a PR). The pdlc grounding template's One-TASK-one-PR rule restated the tier model, so it was synced to the refined level — bootstrap 0.3.0, marketplace 0.16.0 lockstep. Eleven wiki notes re-pinned honestly (pdlc-plugin re-verified substantively). Downstream Coda's constitution amendment can now cite an upstream statement that exists.
<!-- SECTION:FINAL_SUMMARY:END -->
