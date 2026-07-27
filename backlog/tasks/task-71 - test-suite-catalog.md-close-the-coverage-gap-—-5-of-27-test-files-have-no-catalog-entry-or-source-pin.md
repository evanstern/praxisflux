---
id: TASK-71
title: >-
  test-suite-catalog.md: close the coverage gap — 5 of 27 test files have no
  catalog entry or source pin
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 04:34'
updated_date: '2026-07-27 14:16'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/wiki/test-suite-catalog.md (created by TASK-62's summary-style split, extended by 65/59/63/66) covers only 22 of 27 test files: build-npm, new-plugin, pdlc, phase-status, reorient, and run-gates test files have no bullets and are missing from the note's sources — inherited from the old pre-split test-suite.md source list, so changes to those suites never stale the catalog (TASK-64 hit exactly this: test/reorient.test.mjs gained cross-directory tests invisibly). Add the missing per-file entries and sources; verify the note stays within the 8000-char body budget (split again summary-style if it cannot); regenerate CAPSULES if the description changes. Count the actual test-file set at execution time rather than trusting the 22/27 snapshot. Origin: gaps flagged by TASK-64's and TASK-66's implementers during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every test/*.test.mjs file has a catalog entry and appears in the catalog note's sources (set enumerated at execution time)
- [ ] #2 Note body within the 8000-char budget (further summary-style split if needed); INDEX/CAPSULES consistent
- [ ] #3 Wiki freshness gate green with the expanded source list
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author spec 032-test-suite-catalog-closure (spec/plan/tasks). 2. Enumerate the ACTUAL test/*.test.mjs set at execution time; add missing per-file bullets + sources to docs/wiki/test-suite-catalog.md. 3. The note is at ~7996/8000 chars — expect a summary-style split (second catalog note), INDEX updated, CAPSULES regenerated for any new/changed description. 4. Freshness gate green with the expanded source list; wiki-only, no version bump.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch (runbook docs/design/sweep-followups-runbook.md): model tier = default implementer — wiki-only catalog closure, mechanical but enumeration-sensitive; tail lane by design (runs after all Lane A merges so the enumeration covers their new test files).
<!-- SECTION:NOTES:END -->
