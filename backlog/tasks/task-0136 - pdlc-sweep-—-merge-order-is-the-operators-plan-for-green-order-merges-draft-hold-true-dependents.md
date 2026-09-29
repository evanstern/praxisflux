---
id: TASK-0136
title: >-
  pdlc:sweep — merge order is the operator's: plan for green-order merges,
  draft-hold true dependents
status: To Do
assignee: []
created_date: '2026-09-29 09:50'
labels:
  - pdlc
  - sweep
  - concurrency
dependencies: []
priority: medium
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Field report from the-stacks M1 wave-1 sweep (2026-09-29; the-stacks docs/design/m1-wave1-sweep-runbook.md retrospective).

pdlc:sweep assumes the orchestrator merges serially in lane order (step 8). On hosts where the orchestrator may not merge its own PRs (permission classifier) the operator merges, and does so as PRs go green. The runbook's 'TASK-0020 merges first' did not hold: #21 merged first, with CI red on main, then #22 and #23. TASK-0020 needed two extra reconcile merges and lost six spec tasks.md ticks in one of them, which only a later spec-bridge plan surfaced.

Proposed doctrine: (1) a runbook marks each lane edge as a HARD dependency (the dependent PR is opened as a draft until the prerequisite merges) or SOFT (merge in any order, budget one reconcile merge per late PR). (2) Step 8 covers the operator-merges mode: ping when green, never report ready while main CI is red, and after the operator merges, verify with gh api and continue. (3) After every reconcile merge, diff the task's tasks.md tick count against the pre-merge branch and restore lost ticks before re-gating. (4) Reconcile guidance includes 'take the card side that is the superset', not 'take main' — the branch usually holds the Dispatch lines.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The runbook template marks each lane edge hard (draft-held) or soft (reconcile-budgeted)
- [ ] #2 Step 8 documents an operator-merges mode: green ping, no ready while main CI is red, gh api merge verification
- [ ] #3 After each reconcile merge the sweep checks tasks.md tick counts against the pre-merge branch
- [ ] #4 Card-conflict guidance says take the superset side, with the marker-count comparison
<!-- AC:END -->
