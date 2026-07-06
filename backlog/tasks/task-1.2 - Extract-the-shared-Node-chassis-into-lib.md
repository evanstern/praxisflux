---
id: TASK-1.2
title: Extract the shared Node chassis into lib/
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - chassis
dependencies:
  - TASK-1.1
parent_task_id: TASK-1
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the zero-dependency Node modules both plugins need: project-root (findRootUpwards + detectProjectKind), gate-runner (Stop-hook harness: read stdin, honor stop_hook_active, additive gate dispatch, exit 0/2), markdown (parseFrontmatter, stripCode, extractWikilinks, resolveLinks), selfcontained (HTML verifier), lifecycle (status-cannot-exceed-proven-artifacts engine), installer (dotfile-safe copy, fresh vs update/migrate mode, ensures .gitignore has .handoff/), dates, template.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 each module is zero-dep and independently usable
- [ ] #2 lifecycle engine expresses 'status cannot exceed proven artifacts' generically
- [ ] #3 installer supports fresh-install AND idempotent update/migrate, dotfile-safe, and appends .handoff/ to .gitignore
<!-- AC:END -->
