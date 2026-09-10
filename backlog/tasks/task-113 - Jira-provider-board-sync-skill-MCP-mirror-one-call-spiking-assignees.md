---
id: TASK-113
title: 'Jira provider: board:sync skill (MCP -> mirror), one-call spiking, assignees'
status: Done
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-09-10 14:54'
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
- [x] #1 providers.jira registered as requiresSync:true/project:null; lib/ has no mcp__ or fetch( (grep-asserted)
- [x] #2 spec-bridge/skills/board-sync/SKILL.md in gate-work-gate pattern with all three sections
- [ ] #3 board:sync writes a valid mirror with observedAt+observedSha on every link, and COMMITS it
- [x] #4 Unlinked issues (no Spec: marker) excluded from the mirror; count reported
- [x] #5 Status round-trips through statusMap both directions; unmapped falls through; non-injective map errors
- [ ] #6 Reverse direction executes renderJira calls in order then re-syncs; git status clean under every spec dir
- [x] #7 board:create is exactly ONE MCP call with zero discovery; missing coordinate is a named config error; spiking triggers no sync
- [x] #8 defaultAssignee self resolves once per session; board:claim sets assignee AND status; name-is-not-an-id documented
- [x] #9 All four sweep points proven by evidence (live site or stated fixtures) — incl. Done-over-unchecked-boxes yields a BLOCKING finding
- [x] #10 Trust boundary stated verbatim in board-verbs.md and the peer block; versions bumped; wiki re-pinned; README/CLAUDE updated
- [x] #11 Spec phase: Phase 1 — Verify the MCP surface (output is knowledge, not code)
- [x] #12 Spec phase: Phase 2 — Read path: provider, JQL, extraction, mirror
- [x] #13 Spec phase: Phase 3 — Write path: execute the renderer's calls
- [x] #14 Spec phase: Phase 4 — Spike, assignees, sweep proof, re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SWEEP HOLD (2026-08-28, orchestrator precondition gate). NOT signed off; do not claim. Finding F2 — the Atlassian MCP is HARD-BLOCKED on this host: three calls across two tools (getAccessibleAtlassianResources, atlassianUserInfo) and two AWS regions all returned an AWS WAF CAPTCHA challenge page rather than a tool result. That is a browser-verification wall — not a flake, not an auth error, and NOT 'no Jira configured'. Consequence: this spec's Phase 1 (the live write->read marker test) and every AC needing a live site cannot run until MCP access is restored. Gate for any session reaching this task: re-probe with ONE MCP call first and STOP if the response is HTML. Do not substitute fixtures for the live test Phase 1 exists to be — Phase 1 is knowledge-only precisely because the knowledge must come from the real site. Note also F1: this task's Phase 1 is the only test of spec 055's premise, so it must run BEFORE TASK-112 is claimed, inverting the runbook's lane order. Full detail: runbook findings F1/F2.

spec-bridge sync: Phase 1 — Verify the MCP surface (output is knowledge, not code): 0/7 · Phase 2 — Read path: provider, JQL, extraction, mirror: 0/14 · Phase 3 — Write path: execute the renderer's calls: 0/6 · Phase 4 — Spike, assignees, sweep proof, re-ground: 0/12 — status To Do → In Progress

Lane 3' COMPLETE (2026-09-09, orchestrator-run, not dispatched — knowledge-only phase). Spec 056 Phase 1 run live under the operator's Lanes 3-4 sign-off; findings committed at specs/056-jira-provider/findings/phase-1-mcp-surface.md (branch task-113-jira-provider, d874b88).

F1 DISCHARGED: the <!-- spec-phases --> markers SURVIVE a Jira description write->read cycle in contentFormat markdown — BEGIN/END verbatim, checkbox syntax intact, checked/unchecked preserved, Spec: marker intact, trailing text not swallowed. A second write with a different tick pattern persisted with byte-identical normalization, so the cycle is idempotent, not degrading. Spec 055 needs NO amendment; TASK-112 is clear to claim.

Two silent normalizations the parser must tolerate (absent from 055's fixtures — the gap F1 named): a blank line inserted after BEGIN, and trailing whitespace on the last checkbox. Block contract is MARKDOWN-ONLY: an html read returns the markers as escaped entities, converts checkboxes to an ADF task-list with server UUIDs, and swallows END inside the final <li>.

Live finding for Phase 2: the host workflow is NOT the three-status vocabulary statusMap assumes — nine transitions from Open, several distinct statuses sharing one statusCategory (four 'new', three 'indeterminate'), so a category-keyed map is non-injective by construction. Map on status NAME. Tool-name corrections: listJiraIssueTransitions (not getTransitionsForJiraIssue), listJiraProjectIssueTypesMetadata (not getJiraProjectIssueTypesMetadata). JQL pagination is token-based (nextPageToken/isLast), not startAt.

Phase 1 ticked 6/7. The resolution quirk is UNVERIFIED and owed before Phase 3: testing it needs workflow writes on a real corporate project, the sign-off covered a description round-trip only, and the permission boundary declined.

Tier: this phase was knowledge-only and run by the orchestrator directly (no implementer dispatch, so no served-model note applies). Phases 2-4 remain sonnet / cc/claude-sonnet-5[1m] per the runbook.

OWED TO THE OPERATOR: delete or close the scratch issue (titled '[SCRATCH — praxisflux spec 056 Phase 1] marker survival test, safe to delete'). The orchestrator has no delete authorization.

spec-bridge sync: Phase 1 — Verify the MCP surface (output is knowledge, not code): 7/7 · Phase 2 — Read path: provider, JQL, extraction, mirror: 14/14 · Phase 3 — Write path: execute the renderer's calls: 6/6 · Phase 4 — Spike, assignees, sweep proof, re-ground: 12/12 — status In Progress → Done

AC #3 and #6 deliberately LEFT UNCHECKED — the honest residue of this task.

Both proven at the MECHANISM level, neither end-to-end through the skill:
- #3: writeMirror stamping observedAt/observedSha on every link, validateMirror clean,
  and board-mirror --check exit 0 were all run against a mirror built from live board
  data. What was NOT run: the board-sync skill itself, in a repo configured as a Jira
  host, writing AND COMMITTING its own mirror. praxisflux is a backlog host with no
  .board.json, so there is no place here to exercise that path honestly.
- #6: renderJira ordering is unit-tested, the raw-diff -> parse -> apply -> render ->
  write loop was proven against live wire bytes, and transitions/resolution-clearing
  were executed live. What was NOT run: spec-bridge:sync executing a renderJira call
  LIST in order against a Jira-configured host and then re-syncing, with the one-way
  contract asserted by git status over that run.

Ticking either would claim a status the artifacts do not prove — exactly what this
feature exists to prevent. They need a real Jira-hosted project; praxisflux cannot be
one without ceasing to be a backlog host (design invariant 2: one board, singular).
Recommend a follow-up task for the end-to-end run on a genuine Jira host.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Phase 1 — Verify the MCP surface (output is knowledge, not code): 7/7 · Phase 2 — Read path: provider, JQL, extraction, mirror: 14/14 · Phase 3 — Write path: execute the renderer's calls: 6/6 · Phase 4 — Spike, assignees, sweep proof, re-ground: 12/12). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
