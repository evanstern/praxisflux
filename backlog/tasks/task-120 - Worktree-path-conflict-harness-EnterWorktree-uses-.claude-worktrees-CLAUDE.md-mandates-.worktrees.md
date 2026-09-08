---
id: TASK-120
title: >-
  Worktree path conflict: harness EnterWorktree uses .claude/worktrees,
  CLAUDE.md mandates .worktrees
status: To Do
assignee: []
created_date: '2026-09-08 17:41'
updated_date: '2026-09-08 17:41'
labels:
  - doctrine
  - pdlc
  - tech-debt
dependencies: []
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in execution during the TASK-119 sweep (2026-09-08), raised by the operator.

CLAUDE.md lines 79-80 mandate: all branch work happens in a worktree, and "Worktrees live under <repo-root>/.worktrees/ (gitignored), one per task". The .gitignore backs this with a ".worktrees/" entry.

But the Claude Code harness's EnterWorktree tool creates worktrees at ".claude/worktrees/<name>" — that path is the tool's fixed isolation root, not configurable at the call site — and pdlc:sweep's background-job/no-main-push execution mode EXPLICITLY prescribes it: "Task worktrees live at .claude/worktrees/task-<N> — the harness's isolation root, entered via the harness's worktree switch (EnterWorktree) — not .worktrees/task-<N>."

So a background-job sweep on this host cannot satisfy both documents. TASK-119's own worktree sits at .claude/worktrees/task-119 for exactly this reason.

Cost so far: an operator-visible inconsistency, plus a real hazard already found. The .claude/worktrees/ path accumulated an ORPHANED tree (refactor-triage-2026-07-31, 7.6M) whose pointer references a repo location that no longer exists. It carries its own backlog/ and docs/wiki/, and its test suite exits 1. It is invisible to the worktree listing, so no worktree-hygiene check catches it. A path that doctrine does not know about is a path nobody sweeps.

Directions (not decided):
1. Bless the harness path in CLAUDE.md for background jobs, keeping .worktrees/ for interactive sessions — documents the split that already exists in the sweep skill.
2. Have the sweep skill stop prescribing the harness path and cut worktrees with a plain worktree-add under .worktrees/ even in background mode, forgoing EnterWorktree isolation.
3. One path for both, whichever wins, and gitignore it.

Whichever direction: worktree hygiene should cover BOTH paths so an orphan cannot hide again.

RELATED, possibly the same root cause (operator report, 2026-09-08): the board does not show branch-held task states from the root checkout. backlog/config.yml has check_active_branches: true and active_branch_days: 30, which per the operator's experience in other repos renders a task In Progress in GRAY when its state lives on another branch. Here the root checkout shows TASK-119 under To Do (its main state) rather than gray under In Progress, while the same command from the task worktree shows it In Progress. The branch is 9 minutes old (well inside 30 days) and both the branch and its flipped task file are visible to git from a shared checkout, so the data is present. Note remote_operations is false, and the binary's own settings UI couples the two (unchecking checkActiveBranches forces remoteOperations false), which makes remote_operations: false the leading suspect for why the branch scan does not run. NOT VERIFIED — testing it means mutating tracked config, which was not done. Whoever picks this up should test that flip first.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The worktree path for background-job sweeps is unambiguous: one document states it and the other does not contradict it
- [ ] #2 Worktree hygiene (the sweep Output gate and any check script) covers whichever paths are sanctioned, so an orphaned tree in either location is detected
- [ ] #3 The existing orphan at .claude/worktrees/refactor-triage-2026-07-31 is removed or explicitly retained with a reason
<!-- AC:END -->
