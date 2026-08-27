---
id: TASK-110
title: >-
  spec-bridge gate reads the mirror: provider-neutral verdicts, fail-closed on
  stale/missing board
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-08-27 16:15'
labels:
  - feature
  - gates
  - spec-bridge
dependencies:
  - TASK-109
priority: high
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Swap the bridge's INPUT, not its logic. boardLinks(root) becomes the single board-reading seam for checkBridge/verifyBridge/planBridge; resolveRoots stops meaning "has a backlog dir"; a stale or declared-but-missing mirror becomes a BLOCKING finding instead of a silent pass.

Backlog.md hosts see zero behavior change — the three existing test files must pass unedited.

Spec: specs/053-bridge-on-mirror
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 boardLinks(root) implements mirror-first / live-backlog / empty; all three entry points use it
- [ ] #2 backlog-only host produces byte-identical verdicts, messages, and planned commands
- [ ] #3 mirror-only host yields identical problems+warnings for equivalent state (differential fixture pair)
- [ ] #4 resolveRoots handles .board-only, backlog-only, and both; gates/cli.mjs resolves identically
- [ ] #5 stale requiresSync mirror yields one blocking problem naming reason and remedy
- [ ] #6 stale non-requiresSync mirror yields NO staleness problem (live projection preferred)
- [ ] #7 declared requiresSync provider with absent mirror yields the blocking no-evidence problem (asserted by message content)
- [ ] #8 planBridge returns structured intents for non-backlog providers; exact command strings for backlog
- [ ] #9 test/spec-bridge, test/project-gates, test/phase-status pass with NO edits to those files
- [ ] #10 New coverage for AC 3-8; docs/wiki re-pinned (spec-bridge-plugin, gates-convention, project-root)
<!-- AC:END -->
