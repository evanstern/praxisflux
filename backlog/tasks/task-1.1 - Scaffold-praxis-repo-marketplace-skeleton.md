---
id: TASK-1.1
title: Scaffold praxis repo + marketplace skeleton
status: To Do
assignee: []
created_date: '2026-07-06 17:05'
labels:
  - chassis
dependencies: []
parent_task_id: TASK-1
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Establish the unified repo layout: .claude-plugin/marketplace.json listing educate/research/build with ./subdir sources; a per-plugin subdir each with its own .claude-plugin/plugin.json; top-level lib/ (shared chassis) and docs/. README + .gitignore already exist.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 marketplace.json lists the plugins with ./subdir sources and validates
- [ ] #2 each plugin subdir has its own .claude-plugin/plugin.json
- [ ] #3 lib/ and docs/ exist as the homes for shared code and authoring docs
<!-- AC:END -->
