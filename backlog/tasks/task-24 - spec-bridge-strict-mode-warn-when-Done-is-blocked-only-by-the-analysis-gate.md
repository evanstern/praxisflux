---
id: TASK-24
title: 'spec-bridge strict mode: warn when Done is blocked only by the analysis gate'
status: To Do
assignee: []
created_date: '2026-07-11 01:36'
labels: []
dependencies: []
priority: low
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spun off from TASK-9.8 (parent TASK-9 closed 2026-07-10; subtask archived) — first-spin finding. With strictDone on, a linked task honestly In Progress with every checkbox checked but a missing analysis.md (or unresolved CRITICAL findings) sits in a silent state — Done is out of reach and nothing says so until someone runs 'cli.mjs state'. Surface it: when a linked task's ONLY shortfall from Done-eligible is the analysis requirement, checkBridge should emit a non-blocking lag-style warning naming the reason ('all tasks checked; Done blocked by strict mode: analysis.md missing' / '...unresolved CRITICAL: <finding>'), shown via gate-runner's warn channel. Never a blocking problem — the status is honest.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 strictDone + all boxes checked + missing analysis.md -> non-blocking warning naming the missing report
- [ ] #2 strictDone + all boxes checked + unresolved CRITICAL -> non-blocking warning naming the finding
- [ ] #3 No such warning in checkbox-only mode, or while tasks.md still has unchecked tasks
- [ ] #4 Tests through gate-runner evaluate() assert these surface as warnings, never problems
<!-- AC:END -->
