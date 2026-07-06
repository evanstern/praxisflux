---
id: TASK-1.10
title: Generalized build/release tooling
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - tooling
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: low
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the self-build: build.mjs --plugin <name>|all that scaffolds each plugin from its spec AND vendors lib/ into each plugin (solving the CLAUDE_PLUGIN_ROOT sibling-dir problem at package time). Generalize sync-version across all plugin.json + marketplace entries; add a marketplace.json generator; add a repo-level pre-commit hook (build + version sync + gate self-check).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 packaging vendors lib/ into each plugin so a shipped .plugin is self-contained
- [ ] #2 version sync keeps every plugin.json and the marketplace entries consistent
- [ ] #3 marketplace.json is generated from the per-plugin manifests
<!-- AC:END -->
