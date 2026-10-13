---
id: TASK-0139
title: 'Harness port: ForHostingAgents — skills and doctrine stop assuming Claude Code'
status: To Do
assignee: []
created_date: '2026-10-13 02:17'
labels:
  - pdlc
  - chassis
  - refactor
dependencies:
  - TASK-0138
  - TASK-0134
references:
  - >-
    backlog/decisions/decision-0002 -
    pdlc-rebuild-one-hexagon-—-a-pdlc-CLI-driving-port-and-four-driven-ports-Tracker-Forge-Spec-Harness.md
  - vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md
priority: high
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Step 2 of the pdlc rebuild (decision-0002, Accepted). Builds on TASK-0138 (chassis) and TASK-0134 (AGENTS.md as the load-bearing planted file).

Define the ForHostingAgents port on the chassis with adapters claude-code, agents-md (generic AGENTS.md + SKILL.md readers such as Codex, Gemini CLI, Copilot, opencode) and headless (claude -p / Agent SDK / CI). The port covers four concerns: always-on context (planted file), procedures (SKILL.md), tool access (pdlc CLI or MCP), and dispatch (harness:dispatch, evidence = the existing 'Dispatch: tier= pinned= served=' line). Enforcement stays with gates and CI; harness hooks become optional local extras.

Rewrite pdlc skill bodies so Claude-only surfaces (Agent tool, ${CLAUDE_PLUGIN_ROOT} script paths, hook event names) appear only behind harness verbs. The claude-code adapter must reproduce today's behavior exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ForHostingAgents is a registered port with claude-code, agents-md and headless adapters, each passing the shared contract suite
- [ ] #2 harness:dispatch is a verb whose evidence is the Dispatch record line; an adapter that cannot pin a model declares the capability missing
- [ ] #3 pdlc skills invoke scripts through the pdlc CLI rather than ${CLAUDE_PLUGIN_ROOT} paths; Claude-only tool names appear only in claude-code adapter text
- [ ] #4 Under the claude-code adapter, bootstrap, sweep, design-rounds and refactor-triage behave identically to today (tests or a recorded headless run prove it)
- [ ] #5 pdlc doctor reports the detected harness and which harness capabilities are available
- [ ] #6 Wiki re-pinned; marketplace and edited skill versions bumped; gates green
<!-- AC:END -->
