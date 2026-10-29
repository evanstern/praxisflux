---
id: TASK-0146
title: >-
  Kimi-tier bake-off: trial kimi/kimi-for-coding as an implementer tier via
  9router
status: To Do
assignee: []
created_date: '2026-10-29 05:04'
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
- [ ] #1 Add a kimi tier (model kimi/kimi-for-coding, non-default, non-escalation) to .claude/model-tiers.json
- [ ] #2 Regenerate agent definitions with pdlc/scripts/tiers.mjs; --check exits 0
- [ ] #3 Restart the session; confirm kimi-implementer is dispatchable
- [ ] #4 Pick one small spec'd board task; dispatch it to sonnet-implementer and kimi-implementer in separate worktrees
- [ ] #5 Record a Dispatch line per run with served= taken from the transcript
- [ ] #6 Record per run: served model, total tokens, tool-call errors, and review fixes needed
- [ ] #7 Write a recommendation (adopt, adopt for a narrower scope, or drop) in the final summary
<!-- AC:END -->
