---
id: TASK-9.3
title: 'Sync skill: derive spec state and reflect it into the linked Backlog task'
status: To Do
assignee: []
created_date: '2026-07-10 02:26'
labels: []
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
priority: medium
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skill that finds linked tasks, runs the derivation module on each spec dir, and reconciles the Backlog task via the backlog CLI: move status (To Do / In Progress; Done only when Done-eligible per derivation), check/uncheck phase ACs, append a progress note like 'Core: 7/12'. ACs are OWNED BY SYNC: on each run the AC list is reconciled to the current phases, so /speckit.tasks regenerating tasks.md (renaming or reshuffling phases) is handled by re-mirroring, not by caching. One-way only: sync never writes into the spec dir.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sync moves a linked task's status to match derived status in both directions (forward progress and regression after regeneration)
- [ ] #2 Phase ACs are checked as their tasks.md tasks complete, and the AC list is re-mirrored when phases change
- [ ] #3 A progress note with per-phase counts is appended on each sync that changed state
- [ ] #4 Sync makes zero writes to the spec directory
<!-- AC:END -->
