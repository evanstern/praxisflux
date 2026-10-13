---
id: TASK-0142
title: >-
  Spec port: ForWritingSpecs with speckit and native adapters; derivation behind
  the port
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
priority: medium
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Step 5 of the pdlc rebuild (decision-0002, Accepted). Builds on TASK-0138 and the Tracker port (the bridge gate consumes derived phases).

Today pdlc writes specs through GitHub Spec Kit and degrades to hand-authored spec/plan/tasks under an operator-signed escape line when Spec Kit is absent (docs/design/speckit-degradation-runbook.md). Those are two adapters of one port. Define ForWritingSpecs: author(task) produces a spec dir; derive(specDir) returns phases with checked state. lib/spec-derive.mjs moves behind the port so a future spec system can keep its own task format. The speckit adapter reproduces today's output; the native adapter formalizes the fallback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ForWritingSpecs is a registered port; speckit, native and an in-memory fake pass one shared contract suite
- [ ] #2 derive(specDir) is the only path by which spec-bridge and pdlc read phase state; lib/spec-derive.mjs is the speckit adapter's implementation
- [ ] #3 The native adapter produces derivable spec dirs without Spec Kit installed, and the sweep's escape-line doctrine points at it
- [ ] #4 Spec Kit hosts see identical spec dirs, links and derived states to today
- [ ] #5 Wiki re-pinned; marketplace and edited skill versions bumped; gates green
<!-- AC:END -->
