---
id: TASK-9.1
title: 'Derivation module: pure specDir -> derived state, on the chassis'
status: To Do
assignee: []
created_date: '2026-07-10 02:26'
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
- [ ] #1 Given a fixture spec dir at each lifecycle stage, derivation returns the correct status
- [ ] #2 Phase names and per-phase done/total counts are derived from tasks.md headings and checkboxes
- [ ] #3 Re-running derivation after a simulated tasks.md regeneration (renamed/added/removed phases) yields correct fresh state with no stale residue
- [ ] #4 Unit tests cover malformed/missing files without crashing (missing tasks.md, empty phases)
<!-- AC:END -->
