---
id: TASK-35.3
title: Tests + registration + docs sync for team-review
status: To Do
assignee: []
created_date: '2026-07-23 05:16'
labels: []
dependencies: []
parent_task_id: TASK-35
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
node --test coverage: checkReview (sections present/missing, citation resolution incl. repeated-basename tolerance, report-inside-target rejection, untouched vs mutated snapshot), run lifecycle (begin/finish/abandon, same-second id collision), stop-hook evaluate paths. Plus the review's registry drift test: run-gates.mjs GATES keys appear in action.yml's documented list. Then: marketplace.json entry (via the now-generative gen-marketplace), README table row, marketplace version bump + skill v1.0.0 per docs/releasing.md, wiki-update pass for touched grounding docs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All listed test cases green under node --test; pre-commit and CI pass
- [ ] #2 Registration, README row, version bumps, wiki freshness all green
<!-- AC:END -->
