---
id: TASK-95
title: tests — pin the 039-047 doctrine in test/pdlc.test.mjs
status: To Do
assignee: []
created_date: '2026-07-31 20:04'
updated_date: '2026-08-03 04:36'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SCOPE ADDITION (operator, 2026-08-03, gates+doctrine sweep Lane 5): fold in TASK-103's summary-style split of docs/wiki/test-suite-catalog-plugins-gates.md, and do it BEFORE adding this task's test anchors.

Why here: that note is at 7,987 / 8,000 body chars (13 chars headroom) after TASK-101 cataloged its two new test files. This task adds test coverage and must catalog it — so it is the task that actually hits the wall. Splitting first is the same contract-shaped-work-first argument that put TASK-93 ahead of the doctrine chain in Lane 1: land the headroom, then spend it. Adding anchors first would force an unplanned split under pressure, which is the failure TASK-93 was carded to prevent.

Requirements carry over from TASK-103: summary-style per docs/corpus-spec.md following the TASK-78 / TASK-93 precedents; parent keeps the name test-suite-catalog-plugins-gates so inbound wikilinks keep resolving; every body <=8,000 and every capsule <=500; INDEX.md hand-maintained (it has no generator) and CAPSULES.md regenerated via grounding-wiki/scripts/capsules.mjs, never hand-edited; choose the split point from measured arithmetic WITH this task's projected new entries already included, leaving real headroom rather than landing at 7,9xx again.
<!-- SECTION:NOTES:END -->
