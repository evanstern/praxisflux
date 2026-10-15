---
id: TASK-0138
title: >-
  Ports chassis: port registry, configurator, receipts, contract-test harness,
  pdlc doctor, credential helper
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-13 02:14'
updated_date: '2026-10-15 16:19'
labels:
  - pdlc
  - chassis
  - feature
dependencies: []
references:
  - >-
    backlog/decisions/decision-0002 -
    pdlc-rebuild-one-hexagon-—-a-pdlc-CLI-driving-port-and-four-driven-ports-Tracker-Forge-Spec-Harness.md
  - vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md
priority: high
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Step 1 of the pdlc rebuild ratified (Proposed) in decision-0002. Design: vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md.

Build the shared machinery every driven port (Tracker, Forge, Spec, Harness) needs, so later port tasks only add a port contract and adapters. No port moves onto the chassis in this task, and no incumbent behavior changes.

Scope: a port registry with adapter discovery under lib/adapters/<port>/; a configurator that reads the declared adapter per port from a repo file and falls back to detection; receipt-file conventions that gates read instead of providers (generalized from .board/links.json); a shared contract-test harness that runs one suite against every adapter of a port, an in-memory fake included; a pdlc CLI entry point with JSON output and a doctor subcommand that reports which adapters can run on this host; a credential helper that resolves a forge token through git credential fill, then env vars.

Constraint: assume only git, node and a POSIX shell. Use Node built-ins only (fetch, child_process for git). Keep lib/ and gates/ free of network and MCP calls.

Spec: specs/073-ports-chassis
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A port registry resolves an adapter by port and name and rejects an adapter missing a required method or a declared floor capability
- [ ] #2 The configurator reads each port's adapter from one repo config file and falls back to detection; the config file choice is recorded in the task notes
- [ ] #3 Receipt conventions are documented and a helper writes byte-deterministic receipts that a gate can --check
- [ ] #4 A contract-test harness runs one node --test suite against a list of adapter factories; a demo port with a fake adapter proves it
- [ ] #5 A pdlc CLI exists with JSON output; pdlc doctor lists each port, its configured adapter, and whether that adapter can run here
- [ ] #6 A credential helper returns a token for a remote host via git credential fill, then env vars, and never prints the token
- [ ] #7 No new runtime dependencies; nothing requires gh, glab, tea, backlog, rg or jq
- [ ] #8 Tests cover registry, configurator, receipts, harness, doctor and credential helper; full suite green
- [ ] #9 Wiki re-pinned for touched sources; marketplace and edited skill versions bumped per docs/releasing.md; gates green
<!-- AC:END -->
