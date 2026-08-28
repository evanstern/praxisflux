---
id: TASK-113
title: 'Jira provider: board:sync skill (MCP -> mirror), one-call spiking, assignees'
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-08-28 19:21'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SWEEP HOLD (2026-08-28, orchestrator precondition gate). NOT signed off; do not claim. Finding F2 — the Atlassian MCP is HARD-BLOCKED on this host: three calls across two tools (getAccessibleAtlassianResources, atlassianUserInfo) and two AWS regions all returned an AWS WAF CAPTCHA challenge page rather than a tool result. That is a browser-verification wall — not a flake, not an auth error, and NOT 'no Jira configured'. Consequence: this spec's Phase 1 (the live write->read marker test) and every AC needing a live site cannot run until MCP access is restored. Gate for any session reaching this task: re-probe with ONE MCP call first and STOP if the response is HTML. Do not substitute fixtures for the live test Phase 1 exists to be — Phase 1 is knowledge-only precisely because the knowledge must come from the real site. Note also F1: this task's Phase 1 is the only test of spec 055's premise, so it must run BEFORE TASK-112 is claimed, inverting the runbook's lane order. Full detail: runbook findings F1/F2.
<!-- SECTION:NOTES:END -->
