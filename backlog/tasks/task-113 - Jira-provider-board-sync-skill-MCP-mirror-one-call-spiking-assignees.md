---
id: TASK-113
title: 'Jira provider: board:sync skill (MCP -> mirror), one-call spiking, assignees'
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-08-27 16:15'
labels:
  - feature
  - spec-bridge
  - gates
dependencies:
  - TASK-109
  - TASK-111
  - TASK-112
priority: high
ordinal: 145000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The model-side half that cannot live in lib/ because it needs MCP.

Registers providers.jira as requiresSync:true (activating every staleness/missing path 052-053 built), ships spec-bridge:skills/board-sync (Jira -> mirror, committed), executes renderJira's calls for the reverse direction, and delivers the operator's two named needs: one-call spiking from config, and first-class assignees.

Proves four sweep points as evidence, not reasoning — including: a card set Done in the Jira UI over unchecked tasks.md boxes MUST produce a blocking finding.

Spec: specs/056-jira-provider
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 providers.jira registered as requiresSync:true/project:null; lib/ has no mcp__ or fetch( (grep-asserted)
- [ ] #2 spec-bridge/skills/board-sync/SKILL.md in gate-work-gate pattern with all three sections
- [ ] #3 board:sync writes a valid mirror with observedAt+observedSha on every link, and COMMITS it
- [ ] #4 Unlinked issues (no Spec: marker) excluded from the mirror; count reported
- [ ] #5 Status round-trips through statusMap both directions; unmapped falls through; non-injective map errors
- [ ] #6 Reverse direction executes renderJira calls in order then re-syncs; git status clean under every spec dir
- [ ] #7 board:create is exactly ONE MCP call with zero discovery; missing coordinate is a named config error; spiking triggers no sync
- [ ] #8 defaultAssignee self resolves once per session; board:claim sets assignee AND status; name-is-not-an-id documented
- [ ] #9 All four sweep points proven by evidence (live site or stated fixtures) — incl. Done-over-unchecked-boxes yields a BLOCKING finding
- [ ] #10 Trust boundary stated verbatim in board-verbs.md and the peer block; versions bumped; wiki re-pinned; README/CLAUDE updated
<!-- AC:END -->
