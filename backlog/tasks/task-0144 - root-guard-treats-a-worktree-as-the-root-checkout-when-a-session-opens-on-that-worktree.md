---
id: TASK-0144
title: >-
  root-guard treats a worktree as the root checkout when a session opens on that
  worktree
status: Done
assignee:
  - '@claude'
created_date: '2026-10-18 19:07'
updated_date: '2026-10-30 02:36'
labels:
  - pdlc
  - bug
  - root-guard
dependencies: []
references:
  - pdlc/hooks/root-guard-hook.mjs
priority: high
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
root-guard-hook.mjs derives the root checkout from $CLAUDE_PROJECT_DIR (pdlc/hooks/root-guard-hook.mjs, lines ~45 and ~478). A Claude Code session opened directly on a worktree sets CLAUDE_PROJECT_DIR to that worktree. The hook then classifies the worktree as root and blocks every commit there.

Observed 2026-10-18 in the-stacks: a session opened on .worktrees/task-0028 could not commit the round-4 fixes. The operator had to route the commit through a second session whose project dir was the repo root.

Fix direction: derive the root checkout from `git rev-parse --git-common-dir` (the main worktree is the parent of the common dir), not from CLAUDE_PROJECT_DIR. Keep CLAUDE_PROJECT_DIR only for jurisdiction (which repo the hook governs).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A session whose CLAUDE_PROJECT_DIR is a linked worktree can commit in that worktree
- [x] #2 The same session is still blocked from non-board commits in the main (root) checkout
- [x] #3 A session whose CLAUDE_PROJECT_DIR is the root keeps today's behavior for root and worktrees
- [x] #4 Tests cover a session rooted at a linked worktree
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Merge origin/main into the branch; re-bump the version if it collides.
2. Review e55393c against each AC; run node --test and scripts/check-docs.mjs.
3. Re-ground the wiki if the freshness gate fails.
4. Tick ACs on evidence, write the final summary, set Done, push, open the PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented during the TASK-0146 bake-off by kimi-implementer (operator kept this run, 2026-10-29). Branch task-0144-root-guard-worktree, worktree .worktrees/task-0144, commit e55393c, pushed, no PR yet. Reviewed: 0 fixes needed; node --test 1324/1324.
Dispatch: tier=kimi pinned=kimi/kimi-for-coding served=kimi-for-coding
Remaining before PR: claim the card on the branch, wiki-update for root-guard notes, tick ACs.

Verified on merged branch (origin/main e17e7e4 merged): node --test 1324/1324; root-guard suite 74/74. AC1: worktree-rooted commit IN worktree ALLOWED test. AC2: worktree-rooted commit/amend/checkout -b/tracked write AT ROOT BLOCKED tests; board-sync at root still ALLOWED. AC3: 20 pre-existing root-rooted tests unchanged and passing. AC4: 8 new worktree-rooted tests (6 pre-bash, 2 pre-write). Version 0.68.1 does not collide (main 0.68.0).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
root-guard-hook.mjs now derives the root checkout from `git rev-parse --git-common-dir` (its parent) instead of CLAUDE_PROJECT_DIR, which stays only as the jurisdiction anchor; falls back to the old behavior when git cannot confirm. A session opened on a linked worktree can now commit/write there while root policy (board-sync carve-out, --amend, branch create, tracked writes) still holds at the main checkout. 8 new tests cover a worktree-rooted session; full suite 1324/1324. Marketplace 0.68.0 -> 0.68.1; wiki re-pinned (14 notes, test catalog entry updated). Implemented by kimi-implementer (TASK-0146 bake-off), reviewed with no fixes.
<!-- SECTION:FINAL_SUMMARY:END -->
