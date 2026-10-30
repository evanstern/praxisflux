---
id: TASK-0144
title: >-
  root-guard treats a worktree as the root checkout when a session opens on that
  worktree
status: To Do
assignee: []
created_date: '2026-10-18 19:07'
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
- [ ] #1 A session whose CLAUDE_PROJECT_DIR is a linked worktree can commit in that worktree
- [ ] #2 The same session is still blocked from non-board commits in the main (root) checkout
- [ ] #3 A session whose CLAUDE_PROJECT_DIR is the root keeps today's behavior for root and worktrees
- [ ] #4 Tests cover a session rooted at a linked worktree
<!-- AC:END -->
