---
id: TASK-95
title: tests — pin the 039-047 doctrine in test/pdlc.test.mjs
status: To Do
assignee: []
created_date: '2026-07-31 20:04'
updated_date: '2026-09-14 13:43'
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

SCOPE ADDITION WITHDRAWN (operator ratification, 2026-09-14, pre-sweep board prune).

The scope addition recorded on 2026-08-03 ('fold in TASK-103's summary-style split of docs/wiki/test-suite-catalog-plugins-gates.md, and do it BEFORE adding this task's test anchors') is WITHDRAWN — its premise no longer holds.

That note existed because the catalog sat at 7,987 / 8,000 body chars (13 chars headroom), so this task — which adds test coverage and must catalog it — was the one that would hit the wall. The split has since landed: measured at HEAD 3c696f1, test-suite-catalog-plugins-gates.md is 7,231 chars with a -pdlc child (6,387) carved off, giving ~769 chars of real headroom. It happened incidentally during the TASK-0124/0125 wiki re-pin work, not through this card. TASK-103 is closed in the same prune with the measurement.

THIS TASK REVERTS TO ITS ORIGINAL SCOPE: pure test-anchoring per ACs #1-#4 — anchors for mode (d), last-run-at, --policy detection, and at least one 043 + one 045 sweep clause in the 047 anchor style; the four-entry-modes title fix; the bootstrap frontmatter regex alignment; node --test green, test-only, no version bump.

Still true and still load-bearing: cataloging. Any test file this task adds must get a catalog entry AND be pinned as a source in the relevant test-suite-catalog note — that is TASK-71's finding, recreated by TASK-101, and it is why the headroom mattered at all. There is now room to do it at the catalog's own one-bullet-per-file standard instead of compressing to fit.

Dependency note: deps are TASK-97, TASK-98, TASK-94 — 'anchor the settled prose' (tests pin prose after it lands). TASK-97 was closed as superseded in this same prune (TASK-106/107 rebuilt that surface), so the live blockers are TASK-98 and TASK-94, both of which still reword clauses this task's anchors would pin. The ordering rationale is unchanged for those two.
<!-- SECTION:NOTES:END -->
