---
id: TASK-92
title: >-
  Worktree discipline: all branch work happens in .worktrees/, repo root stays
  on main
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 14:08'
updated_date: '2026-08-01 14:23'
labels:
  - docs
  - doctrine
dependencies: []
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The repo root checkout was found sitting on a non-main branch (`board-task-labels`, another session's local unpushed board branch) at the start of the TASK-91 sweep, with a fresh sweep commit landing on top of it. Nothing was lost, but the failure mode is silent and cross-session: a session that assumes root discipline ("root is on the default branch and clean") reads a stale board, cuts worktrees from the wrong base, and strands its commits on a branch it does not own.

The praxisflux CLAUDE.md already mandates per-task branches and a PR flow, but says nothing about WHERE that branch is checked out — so `git switch` in the root checkout is a compliant reading. The sweep skill and the prior runbooks assume worktrees, but that assumption lives in plugin doctrine and design docs, not in this repo's own always-on instructions.

Operator ruling (2026-08-01): all work requiring a branch happens in a git worktree; worktrees live under `<repo-root>/.worktrees/`, which is gitignored; the repo root checkout stays on `main`.

Evidence:
- Root checkout observed on `board-task-labels` (local, no upstream) at sweep start 2026-08-01; `origin/main` @ e559591.
- `.gitignore` carries node_modules/, *-generated/, dist/, .DS_Store, .handoff/ — no `.worktrees/`, so a worktree created at the sanctioned path shows up as untracked noise in every root `git status`.
- CLAUDE.md 'Branching' names the per-task branch and the PR flow but not the checkout location.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Repo CLAUDE.md states the worktree requirement: branch work happens in a worktree under .worktrees/, the root checkout stays on main, and board/spec commands run from a defined location
- [x] #2 .gitignore ignores .worktrees/ so a sanctioned worktree never appears as untracked noise at the root
- [x] #3 The rule names what to do when the root is found off main (switch back; never strand commits on a foreign branch), since that is the observed failure
<!-- AC:END -->
