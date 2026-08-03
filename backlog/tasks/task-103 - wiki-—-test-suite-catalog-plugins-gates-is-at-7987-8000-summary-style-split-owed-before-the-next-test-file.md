---
id: TASK-103
title: >-
  wiki — test-suite-catalog-plugins-gates is at 7987/8000; summary-style split
  owed before the next test file
status: To Do
assignee: []
created_date: '2026-08-03 04:36'
updated_date: '2026-08-03 04:36'
labels:
  - debt
  - wiki
dependencies: []
priority: medium
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in execution during the gates+doctrine sweep (2026-08-02/03), while verifying TASK-101 at merge-readiness.

TASK-101 added two test files (test/root-guard-scan.test.mjs, test/root-guard-hook.test.mjs — 117 cases). They were neither cataloged in docs/wiki/test-suite-catalog-plugins-gates.md nor pinned as its sources — TASK-71's finding ('test files with no catalog entry or source pin') recreated one generation later, and invisible to the freshness gate precisely BECAUSE they were not sources. Both were fixed in TASK-101's PR (#125).

The cost of that fix is this card. Adding the two entries took the note from 7,254 to 7,987 / 8,000 body chars — THIRTEEN characters of headroom. The entries were compressed three times to fit, and are now terser than the catalog's own one-bullet-per-file standard.

This is exactly the condition TASK-93 was carded for on docs/wiki/pdlc-sweep-history.md (7,992/8,000), now reproduced in a sibling note. The next test file added to this catalog CANNOT fit, and whoever adds it will be forced into an unplanned split under time pressure — the failure TASK-93 existed to prevent.

Fix shape: a summary-style split per docs/corpus-spec.md, following the TASK-78 and TASK-93 precedents (parent keeps the name and becomes the entry point; children carry detail; every body <=8,000 and every capsule <=500; INDEX/CAPSULES regenerated, never hand-edited). Choose the split point from measured arithmetic WITH projected future entries included, not at a convenient midpoint — TASK-93's Phase 1 showed the naive boundary left too little margin.

Operator decision 2026-08-03: the split is FOLDED INTO TASK-95, which is the task that will actually hit the wall (it adds test anchors and must catalog them). Same contract-shaped-work-first argument that put TASK-93 ahead of the doctrine chain in Lane 1. This card exists as the durable record of the finding and its evidence; TASK-95 carries the execution.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Execution folded into TASK-95 by operator decision 2026-08-03 (see that card's scope-addition note). This card stays as the durable record of the finding, its evidence, and the arithmetic; it is not separately swept.
<!-- SECTION:NOTES:END -->
