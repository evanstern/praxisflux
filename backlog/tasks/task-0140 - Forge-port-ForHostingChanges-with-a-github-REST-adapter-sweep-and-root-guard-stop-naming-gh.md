---
id: TASK-0140
title: >-
  Forge port: ForHostingChanges with a github REST adapter; sweep and root-guard
  stop naming gh
status: To Do
assignee: []
created_date: '2026-10-13 02:18'
labels:
  - pdlc
  - pdlc-sweep
  - chassis
  - feature
dependencies:
  - TASK-0138
references:
  - >-
    backlog/decisions/decision-0002 -
    pdlc-rebuild-one-hexagon-—-a-pdlc-CLI-driving-port-and-four-driven-ports-Tracker-Forge-Spec-Harness.md
  - vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md
priority: high
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Step 3 of the pdlc rebuild (decision-0002, Accepted). Builds on TASK-0138.

Define ForHostingChanges on the chassis: neutral nouns (change request, check result, approval), verbs open, view, merged-state, merge(strategy, expectedSha). Floors: merge-commit support and SHA-guarded merge are required capabilities; an adapter lacking either fails configuration (wiki verified_against pins depend on merge commits). Local git stays unported.

Ship the github adapter over the REST API via Node fetch, with credentials from the chassis helper; gh on PATH is an optional fast path only. Write a .forge receipt (change id, head SHA, merged SHA, strategy) that gates read. Move every forge call site: pdlc:sweep doctrine, the root-guard hook's blocking messages, and any gh use in lib/ or scripts/. Rename forge nouns in doctrine to 'change request' where the text is forge-neutral (docs/principles.md, planted grounding block).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ForHostingChanges is a registered port; the github adapter and an in-memory fake pass one shared contract suite
- [ ] #2 Configuration refuses a forge adapter that lacks merge-commit or SHA-guarded merge
- [ ] #3 The github adapter works with no gh binary installed, using fetch and the chassis credential helper
- [ ] #4 Merges record a forge receipt and a gate can verify merged-at-SHA from it offline
- [ ] #5 No pdlc skill, hook, script or lib module names gh; every forge action goes through pdlc forge verbs
- [ ] #6 Outcomes on a GitHub host are identical to today (same PRs, merge commits, merged checks)
- [ ] #7 Doctrine uses forge-neutral nouns where the rule is forge-neutral
- [ ] #8 Wiki re-pinned; marketplace and edited skill versions bumped; gates green
<!-- AC:END -->
