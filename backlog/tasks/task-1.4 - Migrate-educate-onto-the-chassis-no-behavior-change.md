---
id: TASK-1.4
title: Migrate educate onto the chassis (no behavior change)
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - educate
  - chassis
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Re-host educate on lib/: progress.mjs uses the shared lifecycle/project-root modules; gate.sh becomes a thin shim over gate-runner; reference lib via CLAUDE_PLUGIN_ROOT. Pure refactor - existing educate projects must gate identically.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 progress --sync/--check/--gate behavior is preserved on existing projects
- [ ] #2 gate.sh delegates to the shared gate-runner
- [ ] #3 educate references shared modules from lib/, not private copies
<!-- AC:END -->
