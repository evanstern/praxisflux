---
id: TASK-9.4
title: 'Bridge gate: linked task status can''t exceed derived status (Stop hook)'
status: To Do
assignee: []
created_date: '2026-07-10 02:26'
labels: []
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
priority: medium
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A gate in the gate-runner shape ({ name, resolveRoots, check, warn? }) wired as the plugin's Stop hook via lib/gate-runner.mjs. resolveRoots finds projects with both backlog/ and specs/; check re-runs the derivation for every linked task and reports a blocking problem when the task's Backlog status exceeds its derived status (e.g. marked Done while tasks.md has unchecked boxes). Optionally warn (non-blocking) when Backlog status LAGS derived state, nudging a sync. This is the praxis principle 'status can't exceed proven artifacts' applied to Spec Kit artifacts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Gate blocks the stop when any linked task's status exceeds its derived status, naming the task and the missing artifacts
- [ ] #2 Gate resolves no roots (no-op) in projects without linked tasks
- [ ] #3 Lagging-but-honest status produces at most a non-blocking warning
- [ ] #4 Unit tests cover the gate via gate-runner's evaluate()
<!-- AC:END -->
