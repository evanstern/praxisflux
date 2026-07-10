---
id: TASK-9.7
title: 'Deterministic sync: cli ''plan'' command emits the exact backlog edits'
status: To Do
assignee: []
created_date: '2026-07-10 04:10'
labels: []
dependencies:
  - TASK-9.3
parent_task_id: TASK-9
priority: medium
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
First-spin finding: the sync skill's AC re-mirroring works but is mechanical-and-wordy for the model (compute the diff, remove stale ACs highest-index-first, re-add, re-check) — exactly the kind of bookkeeping that should be computed, not reasoned. Add 'plan <root>' to spec-bridge/gates/cli.mjs: for each linked task, diff current task state (extend parseLinkedTask to also read the task's ACs and their checked state — still read-only) against the derived spec state, and PRINT the ordered 'backlog task edit ...' commands that reconcile them (status, Spec-phase AC add/remove/check/uncheck, progress-note append). The skill then just runs the emitted commands and verifies — sync becomes nearly deterministic. gates/ stays read-only: plan prints commands, never executes them. Human-authored ACs (not prefixed 'Spec phase:') must never appear in the output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 plan <root> emits the ordered backlog CLI commands that reconcile each linked task to its derived state (status, phase-AC add/remove highest-index-first, check/uncheck, change-only progress note)
- [ ] #2 Running the emitted commands verbatim leaves 'cli.mjs check' clean with no lag warnings for those tasks
- [ ] #3 On an already-reconciled board, plan emits nothing (idempotent no-op)
- [ ] #4 Commands never touch ACs that don't start with 'Spec phase:'
- [ ] #5 sync SKILL.md is rewritten around plan as its backbone; tests cover status move, post-regeneration re-mirror, and the no-op case
<!-- AC:END -->
