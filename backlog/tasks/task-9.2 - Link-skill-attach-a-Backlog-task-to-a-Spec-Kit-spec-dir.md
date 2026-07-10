---
id: TASK-9.2
title: 'Link skill: attach a Backlog task to a Spec Kit spec dir'
status: To Do
assignee: []
created_date: '2026-07-10 02:26'
labels: []
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
priority: medium
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skill that creates (or attaches to) a Backlog task for a given specs/NNN-feature/ dir. Plants a deterministic marker the sync and gate can find (e.g. 'Spec: specs/NNN-feature/' line in the task description or a spec:NNN label). Seeds the task's acceptance criteria from the current tasks.md phases via the derivation module. All Backlog writes go through the backlog CLI (never hand-edit task files).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Linking creates or updates a Backlog task carrying a machine-findable spec-dir marker
- [ ] #2 The task's ACs mirror the spec's current tasks.md phases at link time
- [ ] #3 Linking an already-linked spec dir is idempotent (no duplicate tasks or ACs)
<!-- AC:END -->
