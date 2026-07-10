---
id: TASK-9.5
title: 'Analyze-gated Done: require a proof artifact beyond checked boxes'
status: To Do
assignee: []
created_date: '2026-07-10 02:26'
updated_date: '2026-07-10 02:27'
labels: []
dependencies:
  - TASK-9.3
  - TASK-9.4
parent_task_id: TASK-9
priority: low
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Strict mode for Done derivation. All-checkboxes-checked is necessary but weak proof; this slice adds an optional requirement that a Spec Kit analysis report exists as a FILE in the spec dir (e.g. specs/NNN-feature/analysis.md, saved by the model when running /speckit.analyze) with no unresolved CRITICAL findings, before derivation returns Done-eligible. Since /speckit.analyze is a slash command with chat output, the sync/link skills must instruct that its report be saved into the spec dir so the gate can read it — artifacts, not vibes. Configurable: projects can run in checkbox-only mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 With strict mode on, a spec with all boxes checked but no analysis report derives as In Progress, not Done-eligible
- [ ] #2 An analysis report containing unresolved CRITICAL findings blocks Done-eligibility with a problem naming the findings
- [ ] #3 Checkbox-only mode preserves the prior behavior
<!-- AC:END -->
