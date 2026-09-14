---
id: TASK-103
title: >-
  wiki — test-suite-catalog-plugins-gates is at 7987/8000; summary-style split
  owed before the next test file
status: Done
assignee: []
created_date: '2026-08-03 04:36'
updated_date: '2026-09-14 13:41'
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

CLOSED — CONDITION RESOLVED (operator ratification, 2026-09-14, pre-sweep board prune).

This card warned that docs/wiki/test-suite-catalog-plugins-gates.md sat at 7,987 / 8,000 body chars (13 chars headroom) and that the next test file added to it could not fit. Measured against HEAD 3c696f1, that wall is gone:

  test-suite-catalog.md                    7,993
  test-suite-catalog-plugins-gates.md      7,231   <- this card's note (was 7,987)
  test-suite-catalog-plugins-gates-pdlc.md 6,387   <- child split off
  test-suite-catalog-plugins-pipeline.md   2,688
  test-suite-catalog-plugins.md            1,411

The summary-style split this card specified HAPPENED — a -pdlc child was carved out and the parent kept its name (so inbound wikilinks still resolve), exactly the shape the card prescribed. It landed incidentally during the TASK-0124/0125 wiki re-pin work (git log on the child: 4381ba8, 06d9be0, 4a299b5, c6fcc31) rather than through this card or TASK-95.

The parent now has ~769 chars of headroom, which is real room for the next catalog entry rather than the 13 chars that made this urgent.

Consequence for TASK-95: its scope-addition note ('fold in TASK-103's split, and do it BEFORE adding this task's test anchors') is now dead and is being removed in the same prune — TASK-95 reverts to a pure test-anchoring card.

Note test-suite-catalog.md (the hub) is at 7,993 / 8,000 — 7 chars. That is a DIFFERENT note from this card's subject and is genuinely tight, but this card never covered it. Not silently folding it in; if it needs a split that is its own carded finding.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Closed as resolved-by-other-work rather than executed. The 13-char headroom condition on docs/wiki/test-suite-catalog-plugins-gates.md was cleared when a -pdlc child note was split off during the TASK-0124/0125 re-pin work: the note is now 7,231/8,000 (~769 chars headroom) and the split followed this card's prescribed summary-style shape (parent keeps the name, children carry detail). This card was already execution-delegated to TASK-95 and existed only as the durable record of the finding; that record is now complete with the resolving measurement. TASK-95's dependent scope-addition removed in the same prune.
<!-- SECTION:FINAL_SUMMARY:END -->
