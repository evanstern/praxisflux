---
id: TASK-1
title: Unify educate + research into the praxis plugin suite on a shared chassis
status: To Do
assignee: []
created_date: '2026-07-06 17:04'
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
- [ ] #1 All child tasks are complete and the marketplace hosts educate + research (+ build) as separate installable plugins sharing lib/
- [ ] #2 No Python remains; all gates/scripts are Node/Shell
- [ ] #3 The research→teach→build loop composes through files + gates, with a documented handoff protocol
<!-- AC:END -->
