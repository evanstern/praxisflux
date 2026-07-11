---
id: TASK-9.7
title: 'Deterministic sync: cli ''plan'' command emits the exact backlog edits'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 04:10'
updated_date: '2026-07-11 01:37'
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
- [x] #1 plan <root> emits the ordered backlog CLI commands that reconcile each linked task to its derived state (status, phase-AC add/remove highest-index-first, check/uncheck, change-only progress note)
- [x] #2 Running the emitted commands verbatim leaves 'cli.mjs check' clean with no lag warnings for those tasks
- [x] #3 On an already-reconciled board, plan emits nothing (idempotent no-op)
- [x] #4 Commands never touch ACs that don't start with 'Spec phase:'
- [x] #5 sync SKILL.md is rewritten around plan as its backbone; tests cover status move, post-regeneration re-mirror, and the no-op case
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
spec-bridge gains 'plan <root>': a pure, read-only planner (planLinkedTask/planBridge in gates/bridge.mjs) printing the ordered backlog task edit commands that reconcile every linked task to its derived spec state — status moves incl. honest backwards moves and Done-eligible -> -s Done with derived final summary, Spec-phase AC removals highest-index-first, additions, check/uncheck at post-edit indexes, one change-only note per task; human ACs structurally untouchable, unknown statuses reported never guessed, reconciled board plans nothing. parseLinkedTask additionally parses the AC:BEGIN/END block. Verified end-to-end against the real backlog CLI (plan -> sh -> re-plan empty -> check clean) across lag/Done/regeneration flows, plus 5 unit tests. sync SKILL.md rewritten with plan as backbone (0.1.1). Marketplace 0.6.3. Merged in PR #30. (Done status re-applied: the original finalize commit was lost in the PR #30 conflict rebuild.)
<!-- SECTION:FINAL_SUMMARY:END -->
