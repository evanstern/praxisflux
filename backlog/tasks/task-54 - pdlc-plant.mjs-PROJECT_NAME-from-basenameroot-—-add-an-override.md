---
id: TASK-54
title: 'pdlc plant.mjs: PROJECT_NAME from basename(root) — add an override'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-26 17:47'
updated_date: '2026-07-26 20:48'
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

Spec: specs/017-plant-name-override
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 plant.mjs accepts an explicit name override (or derives from repo metadata with basename fallback), covered by tests including the worktree case
- [x] #2 bootstrap SKILL.md documents the override; re-plant from a differently-named checkout is not spuriously drifted
- [x] #3 Versions bumped per docs/releasing.md (pdlc released surface)
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
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

Implemented: resolveProjectName ladder — --name flag > .pdlc-recorded name > worktree gitdir: parse (primary checkout's basename) > basename(root). Design decision: .pdlc stores the resolved name, making it sticky — re-plants from any differently-named checkout reproduce the same block (unchanged, never spuriously drifted); only --name changes it, surfacing as honest drifted + --force. Legacy sentinels tolerated. 4 net-new tests incl. real git-worktree round-trip (18 pdlc tests). bootstrap SKILL.md 0.5.0 documents the ladder + sticky doctrine; output gate verifies heading + sentinel name. Marketplace 0.26.0 after two re-bumps (56 took 0.24.0, 55 took 0.25.0). pdlc-plugin holds three Since citations (0.23.0 trace / 0.25.0 paused / 0.26.0 name) at 7996/8000. 210 tests, check-docs, wiki-freshness, bump gate green. Closes TASK-43 dogfood finding #2.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PROJECT_NAME no longer depends on where you happen to be standing: plant.mjs resolves it via --name > the .pdlc-recorded name > the primary checkout's basename (parsed from a worktree's gitdir: pointer) > basename(root), and records the resolved name in the sentinel so it is sticky — re-plants from any differently-named checkout (worktree, renamed clone) reproduce the same block as unchanged, and only an explicit --name rename surfaces as honest drift requiring --force. bootstrap 0.5.0, marketplace 0.26.0. Closes TASK-43 dogfood finding #2 — the trap that fired twice live during the planted-artifact refresh is gone.
<!-- SECTION:FINAL_SUMMARY:END -->
