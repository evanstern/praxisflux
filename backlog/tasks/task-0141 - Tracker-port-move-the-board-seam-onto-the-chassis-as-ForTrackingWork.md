---
id: TASK-0141
title: 'Tracker port: move the board seam onto the chassis as ForTrackingWork'
status: To Do
assignee: []
created_date: '2026-10-13 02:18'
labels:
  - pdlc
  - spec-bridge
  - chassis
  - refactor
dependencies:
  - TASK-0138
references:
  - >-
    backlog/decisions/decision-0002 -
    pdlc-rebuild-one-hexagon-—-a-pdlc-CLI-driving-port-and-four-driven-ports-Tracker-Forge-Spec-Harness.md
  - vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md
priority: high
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Step 4 of the pdlc rebuild (decision-0002, Accepted). Builds on TASK-0138.

The board seam (specs 052-056: docs/board-verbs.md, lib/board-mirror.mjs providers registry, .board/links.json mirror, statusMap/statusReadMap) becomes the ForTrackingWork port on the chassis. Its read side already follows the pattern; this task finishes the command side: board verbs become pdlc board subcommands executed by adapters, not commands copied into skill prose.

Adapters: backlog-md and jira. Jira keeps the plan/execute split (adapter returns an ordered effect plan for the harness to run via MCP, then a receipt sync) and gains a REST mode if feasible. Settle the backlog-md conflict with the 'never hand-edit Backlog markdown' rule: either contract tests pin the adapter's file output against files the backlog CLI writes, or this adapter keeps the backlog CLI as its own dependency. Record the choice.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ForTrackingWork is a registered port; backlog-md, jira and an in-memory fake pass one shared contract suite (jira's effect plans are asserted, not executed)
- [ ] #2 Every board verb in docs/board-verbs.md is a pdlc board subcommand; skills call those instead of backlog or Jira tools directly
- [ ] #3 The backlog-md decision (direct file writes vs backlog CLI dependency) is recorded with its evidence
- [ ] #4 The bridge gate reads the receipt exactly as today; existing mirror tests pass unchanged
- [ ] #5 Behavior on Backlog.md and Jira hosts is identical to today
- [ ] #6 Wiki re-pinned; marketplace and edited skill versions bumped; gates green
<!-- AC:END -->
