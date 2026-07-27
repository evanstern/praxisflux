---
id: TASK-4
title: Collapse the duplicated dead-pet rule for rename
status: To Do
assignee: []
created_date: '2026-07-27 17:12'
labels:
  - debt
dependencies: []
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The CLI refuses renaming a dead pet (bin/pet.mjs:45) even though the state machine already no-ops (src/pet.mjs:30 rename). Make the CLI trust the state machine like every other verb — one rule, one home.

Finding: F1 in docs/reviews/refactor-triage-eval-pet-2026-07-27-01.md (triage record docs/reviews/refactor-triage-pet-2026-07-27-01.md). No dependencies — immediately sweepable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CLI rename path no longer duplicates the alive check; behavior unchanged (dead pet still refused with a message)
<!-- AC:END -->
