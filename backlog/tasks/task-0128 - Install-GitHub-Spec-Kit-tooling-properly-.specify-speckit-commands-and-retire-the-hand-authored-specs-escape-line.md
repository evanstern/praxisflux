---
id: TASK-0128
title: >-
  Install GitHub Spec Kit tooling properly (.specify/ + /speckit commands) and
  retire the hand-authored-specs escape line
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-10 17:41'
updated_date: '2026-09-11 16:44'
labels:
  - pdlc
  - tooling
dependencies: []
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Operator finding during the sweep-cost-offload sweep (2026-09-10): the repo has Spec Kit's specs/NNN-slug artifact LAYOUT but not the tooling — no .specify/ (templates, memory/constitution) and no /speckit.* commands. Every sweep since spec 052 has run under the hand-authored-specs escape-line precedent as a result.

Fix: run specify init (or the current Spec Kit install path) against this repo, reconcile its templates with the hand-authored house format specs 001-065 established (board-task header, escape-line header retired, phased tasks.md the bridge derives from), ratify or explicitly skip the constitution, and verify spec-bridge derivation still reads the tool-generated layout. After this lands, future sweep runbooks stop needing the escape line — the Output gate's spec-or-escape-line clause resolves to real Spec Kit artifacts.

Approved by operator mid-sweep 2026-09-10 ("we need to fix that after this run by installing spec kit appropriately").
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spec Kit tooling installed: .specify/ present and /speckit.* commands available in this repo
- [ ] #2 Templates reconciled with the house spec format (specs 001-065); spec-bridge derivation verified against a tool-generated spec dir
- [ ] #3 Constitution ratified or its absence explicitly recorded in .specify memory
- [ ] #4 Sweep doctrine updated: the hand-authored-specs escape line retired from future runbooks (pdlc:sweep precondition gate satisfied by .specify/ presence)
<!-- AC:END -->
