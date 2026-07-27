---
id: TASK-71
title: >-
  test-suite-catalog.md: close the coverage gap — 5 of 27 test files have no
  catalog entry or source pin
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 04:34'
updated_date: '2026-07-27 14:25'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/wiki/test-suite-catalog.md (created by TASK-62's summary-style split, extended by 65/59/63/66) covers only 22 of 27 test files: build-npm, new-plugin, pdlc, phase-status, reorient, and run-gates test files have no bullets and are missing from the note's sources — inherited from the old pre-split test-suite.md source list, so changes to those suites never stale the catalog (TASK-64 hit exactly this: test/reorient.test.mjs gained cross-directory tests invisibly). Add the missing per-file entries and sources; verify the note stays within the 8000-char body budget (split again summary-style if it cannot); regenerate CAPSULES if the description changes. Count the actual test-file set at execution time rather than trusting the 22/27 snapshot. Origin: gaps flagged by TASK-64's and TASK-66's implementers during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.

Spec: specs/032-test-suite-catalog-closure
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every test/*.test.mjs file has a catalog entry and appears in the catalog note's sources (set enumerated at execution time)
- [x] #2 Note body within the 8000-char budget (further summary-style split if needed); INDEX/CAPSULES consistent
- [x] #3 Wiki freshness gate green with the expanded source list
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author spec 032-test-suite-catalog-closure (spec/plan/tasks). 2. Enumerate the ACTUAL test/*.test.mjs set at execution time; add missing per-file bullets + sources to docs/wiki/test-suite-catalog.md. 3. The note is at ~7996/8000 chars — expect a summary-style split (second catalog note), INDEX updated, CAPSULES regenerated for any new/changed description. 4. Freshness gate green with the expanded source list; wiki-only, no version bump.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch (runbook docs/design/sweep-followups-runbook.md): model tier = default implementer — wiki-only catalog closure, mechanical but enumeration-sensitive; tail lane by design (runs after all Lane A merges so the enumeration covers their new test files).

Enumeration (execution time, worktree task-71): 29 test/*.test.mjs files; catalog sources listed 23. Missing from bullets+sources: test/build-npm.test.mjs, test/new-plugin.test.mjs, test/pdlc.test.mjs, test/phase-status.test.mjs, test/reorient.test.mjs, test/run-gates.test.mjs (6 files — matches the spec's dispatch snapshot). Catalog body measured 7996/8000 chars → summary-style split required.

Split landed: test-suite-catalog.md (repo-tooling half, 13 files, body 6383 chars) + new test-suite-catalog-plugins.md (plugin half, 16 files, body 7424 chars), cross-linked; INDEX.md row added; CAPSULES.md regenerated. 6 missing files now cataloged with sources: build-npm, new-plugin, run-gates (tooling half); pdlc, phase-status, reorient (plugin half).

Both split parts re-pinned to the content commit 6d39b8d0406b331df38aff625654d5dd1e38f253; freshness gate green: 32 note(s) fresh against their pinned sources.

spec-bridge sync: Spec: 2/2 · Implement: 4/4 · Prove: 2/2 — status In Progress → Done
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Spec: 2/2 · Implement: 4/4 · Prove: 2/2). Derived Done by spec-bridge sync. Shipped: catalog coverage closed at the execution-time set (29 files; 6 missing bullets+sources added: build-npm, new-plugin, run-gates, pdlc, phase-status, reorient) via a summary-style split — test-suite-catalog (repo tooling, 13 files, 6383 chars) + test-suite-catalog-plugins (16 files, 7424 chars), cross-linked, INDEX + CAPSULES updated, 32 notes fresh; wiki-only, no version bump; delivered via PR on branch task-71-catalog-closure.
<!-- SECTION:FINAL_SUMMARY:END -->
