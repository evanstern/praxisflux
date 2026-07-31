---
id: TASK-77
title: >-
  team-review orient.mjs --since: range-aware orientation (durable card for the
  TASK-72 deferral)
status: Done
assignee: []
created_date: '2026-07-27 16:26'
updated_date: '2026-07-31 18:17'
labels:
  - debt
dependencies: []
priority: low
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-27-16-07-29 — triage record docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md (group D; report §improved 7), evaluation report docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

Evidence: the range-aware orient.mjs follow-up is named as a 'possible evidence-backed follow-up' in four artifacts — pdlc/skills/refactor-triage/SKILL.md:27, specs/033-refactor-triage/spec.md:67, docs/wiki/pdlc-refactor-triage.md:69, and the TASK-72 card — but was carded nowhere: deferred debt living only in prose, exactly what refactor-triage exists to prevent. This card makes the deferral durable; it is NOT a commitment to build. Evidence bar before implementing (per the original deferral's own wording): a refactor-triage run demonstrably hampered by orient.mjs's whole-repo-only view. First run's data point: the engine handled a range lens fine at repo scale ~7k lines; no hamper observed yet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 decision recorded: build --since (with the evidence cited) or close as not-needed after N runs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision recorded (operator sign-off, PR #108 review, 2026-07-31): CLOSE AS NOT-NEEDED. The card's own evidence bar — a refactor-triage run demonstrably hampered by orient.mjs's whole-repo-only view — has two clean counter-datapoints (runs praxis-2026-07-27-16-07-29 at ~7k lines repo scale, praxis-2026-07-31-11-12-22 range-scoped) and zero observed hampers. Re-card on a demonstrated hamper. No orient.mjs --since built; TASK-80's last-run-at bookkeeping (merged PR #112) covers the adjacent scoping need without touching the engine.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed as not-needed by operator decision (2026-07-31, runbook PR #108 sign-off): two clean triage runs against the card's own evidence bar, zero observed hampers. Decision + citations recorded in notes; re-card on a demonstrated hamper.
<!-- SECTION:FINAL_SUMMARY:END -->
