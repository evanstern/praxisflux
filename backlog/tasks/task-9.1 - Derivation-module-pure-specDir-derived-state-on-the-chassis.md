---
id: TASK-9.1
title: 'Derivation module: pure specDir -> derived state, on the chassis'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 02:26'
updated_date: '2026-07-10 02:49'
labels: []
dependencies: []
parent_task_id: TASK-9
priority: medium
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The heart of the bridge: a pure, stateless function (lib or plugin module, e.g. spec-derive.mjs) that reads a Spec Kit spec dir and returns { status, phases: [{name, done, total}], progressNote }. Rules: no spec.md -> To Do; spec.md+plan.md exist with tasks.md partially checked -> In Progress; all tasks.md checkboxes checked -> Done-eligible. Must parse Spec Kit's tasks.md format (phase headings, '- [ ] T001 [P] desc' checkboxes). Stateless by design so tasks.md regeneration by /speckit.tasks is a non-event: every call re-reads and re-derives, nothing is cached.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a fixture spec dir at each lifecycle stage, derivation returns the correct status
- [x] #2 Phase names and per-phase done/total counts are derived from tasks.md headings and checkboxes
- [x] #3 Re-running derivation after a simulated tasks.md regeneration (renamed/added/removed phases) yields correct fresh state with no stale residue
- [x] #4 Unit tests cover malformed/missing files without crashing (missing tasks.md, empty phases)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-9.1-spec-derive off main
2. lib/spec-derive.mjs: parseTasks(markdown) — phases from ## headings (Phase-prefix stripped), tasks from checkbox lines; deriveSpecState(specDir) — pure read of spec.md/plan.md/tasks.md -> { status, phases:[{name,done,total}], tasksDone, tasksTotal, progressNote }
3. Status rules: no spec.md -> 'To Do'; spec.md present -> at least 'In Progress'; 'Done-eligible' only when plan.md exists AND tasks.md has >=1 task with all checked. Missing/malformed files never throw
4. test/spec-derive.test.mjs per suite conventions (node:test, mkdtempSync fixtures): lifecycle-stage fixtures, phase counts, regeneration re-derive, malformed-file safety
5. node --test green -> check ACs -> commit -> PR
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
lib/spec-derive.mjs: parseTasks (## headings -> phases, checkbox lines -> counts, Phase-prefix stripped, pre-heading tasks bucketed as 'Tasks'), progressNote, deriveSpecState (never throws; missing/unreadable artifacts degrade to the earlier stage). Guarded gaps beyond the canonical rules: spec.md alone -> In Progress; all-checked without spec.md/plan.md can't reach Done-eligible. 6 tests in test/spec-derive.test.mjs; full suite 46/46 green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added lib/spec-derive.mjs to the chassis: parseTasks (tasks.md ## headings -> phases with done/total from checkbox lines), progressNote, and deriveSpecState (spec.md/plan.md/tasks.md -> To Do / In Progress / Done-eligible). Stateless by contract so tasks.md regeneration re-derives cleanly; never throws on malformed dirs so it is safe inside the Stop-hook gate (TASK-9.4). Verified with 6 new tests in test/spec-derive.test.mjs; full suite 46/46 green.
<!-- SECTION:FINAL_SUMMARY:END -->
