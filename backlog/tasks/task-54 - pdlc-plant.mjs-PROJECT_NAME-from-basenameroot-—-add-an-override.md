---
id: TASK-54
title: 'pdlc plant.mjs: PROJECT_NAME from basename(root) — add an override'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-26 17:47'
updated_date: '2026-07-26 20:11'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 017-plant-name-override (hand-authored)
2. spec-bridge:link
3. Dispatch: plant.mjs --name override (or metadata-derived name with basename fallback); worktree-case test; re-plant from a differently-named checkout not spuriously drifted; bootstrap SKILL.md documents it
4. Versions (bootstrap skill + marketplace); wiki re-pin pdlc-plugin; PR; serial merge
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 2 (docs/design/lane-hardening-runbook.md), after TASK-53 (same files). Tier: default implementer. From TASK-43 dogfood finding #2 — the trap fired twice live during the planted-artifact refresh.
<!-- SECTION:NOTES:END -->
