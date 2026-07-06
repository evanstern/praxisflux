---
id: TASK-1
title: Unify educate + research into the praxis plugin suite on a shared chassis
status: Done
assignee: []
created_date: '2026-07-06 17:04'
updated_date: '2026-07-06 19:31'
labels:
  - epic
dependencies: []
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Merge the standalone research skills (~/Claude/Code/research: research-vault, analyze-vault, vault-artifact) and the educate plugin (~/Claude/Code/educate) into ONE marketplace, 'praxis', of independently-installable, mutually-aware plugins that share a zero-dep Node chassis (lib/). Two products, shared plumbing, domain-specific content. Establishes research (ground, drop-anywhere), educate (teach, favored home folder), and a split-out build (implement) plugin, composing via a standardized handoff protocol. Node/Shell only — no Python. See README.md for the target architecture.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All child tasks are complete and the marketplace hosts educate + research (+ build) as separate installable plugins sharing lib/
- [x] #2 No Python remains; all gates/scripts are Node/Shell
- [x] #3 The research→teach→build loop composes through files + gates, with a documented handoff protocol
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
praxis suite complete: educate + research + build as separate installable plugins in one marketplace, sharing a zero-dep Node chassis (lib/). All Node/Shell (no Python; research gates parity-verified vs the originals). The research->teach->build loop composes through files + gates over a documented handoff protocol (.handoff/ transport, evidence in tracked state). 19 tests pass; build.mjs vendors lib per-plugin; pre-commit enforces green.
<!-- SECTION:FINAL_SUMMARY:END -->
