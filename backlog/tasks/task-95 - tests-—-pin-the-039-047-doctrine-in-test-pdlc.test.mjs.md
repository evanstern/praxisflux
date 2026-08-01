---
id: TASK-95
title: tests — pin the 039-047 doctrine in test/pdlc.test.mjs
status: To Do
assignee: []
created_date: '2026-07-31 20:04'
updated_date: '2026-08-01 14:23'
labels:
  - debt
  - tests
dependencies:
  - TASK-97
  - TASK-98
  - TASK-94
priority: medium
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-18-47-56, finding 9 + minor item (i) (report: docs/reviews/team-review-praxis-2026-07-31-18-47-56.md; triage record: docs/reviews/refactor-triage-praxis-2026-07-31-18-47-56.md).

Evidence: the 047 deepening's anchors all pre-existed the range — none of the new 040/042 clauses (--policy detection, tracked-copy fallback, last-run-at, mode (d)) nor any 039/043/045 sweep clause is pinned by any test; gut them and 254 tests stay green. test/pdlc.test.mjs:97's title still says 'all three entry modes' while the skill merged four in the same range (mode (d) added by PR #112 before the test PR #116). test/pdlc.test.mjs:39 keeps the key-order-pinned frontmatter regex the 047 standard removed next door.

Depends on TASK-97/98/94 because they reword the very clauses the new anchors pin — anchor the settled prose (the runbook-authoring precedent: tests pin prose after it lands). (Renumbered 2026-08-01: the cards originally carded as TASK-91/92 by this triage run became TASK-97/98 after those numbers were taken on main.)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 anchors added for mode (d), last-run-at, --policy detection, and at least one 043 + one 045 sweep clause, in the existing 047 anchor style
- [ ] #2 test title reflects four entry modes
- [ ] #3 bootstrap frontmatter test aligned to the 047 regex standard
- [ ] #4 node --test green; test-only, no version bump
<!-- AC:END -->
