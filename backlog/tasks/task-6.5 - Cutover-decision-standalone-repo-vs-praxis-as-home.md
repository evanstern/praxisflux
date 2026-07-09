---
id: TASK-6.5
title: 'Cutover decision: standalone repo vs praxis as home'
status: To Do
assignee: []
created_date: '2026-07-09 18:48'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Slice 5 — needs Evan's decision, do not decide unilaterally. Once the plugin installs from the marketplace, the ~/.claude/skills/codebase-to-course symlink double-triggers. Options: (a) retire/archive the standalone repo, praxis becomes home; (b) keep standalone as upstream and vendor into praxis. Until decided, standalone repo stays untouched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Evan has chosen a cutover model and it is recorded
- [ ] #2 The double-trigger is resolved (symlink removed or vendoring flow documented)
<!-- AC:END -->
