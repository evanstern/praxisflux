---
id: TASK-54
title: 'pdlc plant.mjs: PROJECT_NAME from basename(root) — add an override'
status: To Do
assignee: []
created_date: '2026-07-26 17:47'
labels:
  - pdlc
  - dogfood
dependencies: []
priority: low
ordinal: 89000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-43 dogfood finding #2 (specs/010-bootstrap-dogfood/tasks.md T005): plant.mjs derives PROJECT_NAME from basename(root) with no override, so planting from a git worktree (e.g. .worktrees/task-43) would bake the worktree's name into the block merged to main, and any later re-plant from the real root renders a different name -> spurious drifted. TASK-43 worked around it via a scratch symlink named like the project (path.resolve is lexical). Fix properly: a --name flag, or derive the name from git remote / package metadata with basename as fallback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 plant.mjs accepts an explicit name override (or derives from repo metadata with basename fallback), covered by tests including the worktree case
- [ ] #2 bootstrap SKILL.md documents the override; re-plant from a differently-named checkout is not spuriously drifted
- [ ] #3 Versions bumped per docs/releasing.md (pdlc released surface)
<!-- AC:END -->
