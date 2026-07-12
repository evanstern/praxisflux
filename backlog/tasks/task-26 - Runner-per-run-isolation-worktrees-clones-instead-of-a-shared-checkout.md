---
id: TASK-26
title: 'Runner per-run isolation: worktrees/clones instead of a shared checkout'
status: To Do
assignee: []
created_date: '2026-07-12 01:23'
labels: []
dependencies: []
priority: high
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pilot finding (findings.md; demonstrated live when a human branch-switch nearly corrupted an in-flight agent round): the runner's real-repo /checkout branch-switches a shared working tree. Give each run an isolated git worktree (or clone) of the target; the agent works there; /finish merges back into the target's main and cleans up. Concurrent runs and humans in the original tree become non-events. HIGH because it is the single hard prerequisite for self-hosting (TASK-30).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /checkout {target} creates an isolated per-run worktree/clone; the original tree is never touched mid-run
- [ ] #2 A human switching branches in the target during a run demonstrably cannot affect the run (test or scripted repro)
- [ ] #3 /finish merges the run's work into the target main and removes the worktree; failure paths leave no litter
- [ ] #4 Pilot docs (README/findings) updated
<!-- AC:END -->
