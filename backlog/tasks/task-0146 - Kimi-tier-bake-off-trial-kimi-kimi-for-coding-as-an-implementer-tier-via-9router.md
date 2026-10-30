---
id: TASK-0146
title: >-
  Kimi-tier bake-off: trial kimi/kimi-for-coding as an implementer tier via
  9router
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-29 05:04'
updated_date: '2026-10-30 02:18'
labels:
  - model-tiers
  - experiment
dependencies: []
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
9router (localhost:20128) exposes Kimi coding models (kimi/kimi-for-coding, -highspeed, kimi-k2.7-code, kimi-k3). Kimi may be a cheaper implementer tier between haiku and sonnet. Tool-use translation through 9router is unverified: a direct /v1/messages probe on 2026-10-29 failed only because the gateway key is not in the agent shell. This task runs one controlled comparison before any tier becomes a default. Grok and image work are out of scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Add a kimi tier (model kimi/kimi-for-coding, non-default, non-escalation) to .claude/model-tiers.json
- [x] #2 Regenerate agent definitions with pdlc/scripts/tiers.mjs; --check exits 0
- [x] #3 Restart the session; confirm kimi-implementer is dispatchable
- [x] #4 Pick one small spec'd board task; dispatch it to sonnet-implementer and kimi-implementer in separate worktrees
- [x] #5 Record a Dispatch line per run with served= taken from the transcript
- [x] #6 Record per run: served model, total tokens, tool-call errors, and review fixes needed
- [ ] #7 Write a recommendation (adopt, adopt for a narrower scope, or drop) in the final summary
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add kimi tier to .claude/model-tiers.json  2. Regenerate agent defs  3. Restart session, confirm dispatchable  4. Bake-off sonnet vs kimi on one small spec'd task  5. Record results + recommendation
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
kimi tier added and regenerated; --check green. Next: restart session (agent registry is read at session start) before AC3.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5

AC3 probe (2026-10-29): kimi-implementer dispatched via frontmatter pin; the Agent tool's model param rejects non-Claude IDs (enum sonnet|opus|haiku|fable), so the frontmatter pin is the only route. Read-only probe (README + git log) succeeded: 23,680 tokens, 2 tool uses, 0 tool errors, ~10s. Transcript model fields: kimi-for-coding (x4), kimi/kimi-for-coding (x2).
Dispatch: tier=kimi pinned=kimi/kimi-for-coding served=kimi-for-coding

AC4-6 bake-off on TASK-0144 (operator-picked, 2026-10-29). Identical prompt; worktrees .worktrees/bakeoff-sonnet (branch bakeoff-0144-sonnet, c519e48) and .worktrees/bakeoff-kimi (branch bakeoff-0144-kimi, e55393c), both off origin/main 37ca94e. Neither pushed nor touched the board.

Run kimi:
Dispatch: tier=kimi pinned=kimi/kimi-for-coding served=kimi-for-coding
- 52,640 tokens, 21 tool uses, 357s. Tool-call errors: 0. Malformed edits: none.
- Diff: +147/-17 (hook +44/-16, tests +102, 9 new tests). node --test 1324/1324.
- Review: re-keyed runPreBash (jurisdiction, isRoot, board-sync) AND runPreWrite onto the git-common-dir root; falls back to CLAUDE_PROJECT_DIR if common dir is not .git. Probe matrix: commit allowed in worktree, blocked at root, for both projdir=worktree and projdir=root; pre-write allows the worktree, blocks root. Fixes needed: 0.

Run sonnet:
Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5
- 111,492 tokens, 47 tool uses, 630s. Tool-call errors: 2 (harness refused update_plan from a subagent; not malformed edits).
- First sonnet dispatch failed: passing the Agent model param 'sonnet' overrode the frontmatter pin to claude-sonnet-5-5 (404 model_not_found). Orchestrator error; re-dispatched without the param. Lesson: on this host omit the model param and rely on the frontmatter pin.
- Diff: +119/-9 (hook +47/-8, tests +71, 6 new tests). node --test 1322/1322.
- Review: pre-bash correct (same probe matrix as kimi). runPreWrite left on CLAUDE_PROJECT_DIR: a worktree-rooted session is BLOCKED writing inside its own worktree (exit 2) and ALLOWED writing at root (exit 0), the inverse of intent. Its tests do not cover pre-write. Fixes needed: 1 (re-key runPreWrite + tests).
<!-- SECTION:NOTES:END -->
