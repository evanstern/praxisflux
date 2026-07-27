---
id: TASK-5
title: Add CLI-level tests for --version and rename paths
status: To Do
assignee: []
created_date: '2026-07-27 17:12'
labels:
  - debt
dependencies: []
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The sweep grew the CLI surface with zero CLI tests: --version (bin/pet.mjs:27-29, only a manual Prove check) and rename's usage/exit paths (bin/pet.mjs:41-47). Pin them with node:test child-process runs.

Finding: F2 in docs/reviews/refactor-triage-eval-pet-2026-07-27-01.md (triage record docs/reviews/refactor-triage-pet-2026-07-27-01.md). No dependencies — immediately sweepable (touches the same file as task-4; sweep them in one lane, smallest first).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CLI tests cover --version output/exit 0 and rename usage error/exit 2
<!-- AC:END -->
