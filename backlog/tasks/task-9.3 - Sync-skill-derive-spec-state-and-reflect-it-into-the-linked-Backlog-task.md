---
id: TASK-9.3
title: 'Sync skill: derive spec state and reflect it into the linked Backlog task'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 02:26'
updated_date: '2026-07-10 03:04'
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
- [x] #1 Sync moves a linked task's status to match derived status in both directions (forward progress and regression after regeneration)
- [x] #2 Phase ACs are checked as their tasks.md tasks complete, and the AC list is re-mirrored when phases change
- [x] #3 A progress note with per-phase counts is appended on each sync that changed state
- [x] #4 Sync makes zero writes to the spec directory
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. skills/sync/SKILL.md in gate->work->gate shape on the existing cli backbone (links/state/check)
2. Reconcile per linked task: status strictly = derived (To Do / In Progress; Done only on Done-eligible), re-mirror 'Spec phase:' ACs (add/remove/check/uncheck via backlog CLI; human ACs untouched), append progress note only on change
3. One-way contract stated in the skill: sync never writes into the spec dir
4. Output gate: cli check exits 0 and no lag warnings remain
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
skills/sync/SKILL.md on the 9.2 cli backbone (links/state/check — no new code this slice). Key prescriptions: status strictly = derived incl. backwards moves (regeneration regression is 'the point of the bridge'); Done only via Done-eligible, with final summary; 'Spec phase:' ACs owned wholesale by sync (add/remove highest-index-first/check/uncheck), human ACs untouchable; progress note only when something changed; verdict 'unknown' -> report, don't guess. One-way contract enforced twice: stated up front + output gate checks git status shows no spec-dir writes. Direction mechanics pinned by lib/spec-derive regeneration test.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added skills/sync/SKILL.md: one-way reconcile of every linked task to its derived spec state — status (both directions, Done only on Done-eligible), sync-owned Spec-phase AC re-mirroring, change-only progress notes, zero writes to spec dirs, cli check as output gate.
<!-- SECTION:FINAL_SUMMARY:END -->
