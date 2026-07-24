---
id: TASK-42
title: >-
  team-review: self-review-safe output gate (.handoff residue must not trip the
  read-only check)
status: To Do
assignee: []
created_date: '2026-07-23 17:28'
labels: []
dependencies: []
references:
  - >-
    backlog/docs/reviews/doc-1 -
    Team-review-2026-07-23-—-praxisflux-vs-its-own-tenets.md
priority: medium
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Team-review finding #1 (doc-1), repro'd live on 2026-07-23: when the invoking root == the reviewed target, run.mjs begin snapshots the target BEFORE writing its own run record into .handoff/, so if .handoff/ is not gitignored the porcelain comparison in gates/review.mjs can never match again — the plugin's own paper trail trips its own read-only gate and a self-review cannot pass without manually relocating run records via TEAM_REVIEW_HOME. Fix in the plugin so self-review works even in repos that never gitignored the transport. Released-surface change: bump marketplace + team-review skill versions per docs/releasing.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The porcelain comparison in team-review/gates/review.mjs ignores .handoff/ entries (or the snapshot is taken after the run record is written) so the transport's own residue never counts as a target mutation
- [ ] #2 run.mjs begin escalates its gitignore warning for the self-review case (invoking root == target and .handoff/ not ignored): a clear notice or hard fail, decided and recorded in the task
- [ ] #3 A regression test covers self-review: begin with invoking root == target, run record in-repo, finish passes on an untouched target and still blocks on a genuinely mutated one
<!-- AC:END -->
