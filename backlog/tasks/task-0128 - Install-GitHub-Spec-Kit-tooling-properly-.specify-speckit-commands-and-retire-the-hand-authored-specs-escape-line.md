---
id: TASK-0128
title: >-
  Install GitHub Spec Kit tooling properly (.specify/ + /speckit commands) and
  retire the hand-authored-specs escape line
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-10 17:41'
updated_date: '2026-09-11 16:57'
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

Spec: specs/067-speckit-install
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Spec Kit tooling installed: .specify/ present and /speckit.* commands available in this repo
- [x] #2 Templates reconciled with the house spec format (specs 001-065); spec-bridge derivation verified against a tool-generated spec dir
- [x] #3 Constitution ratified or its absence explicitly recorded in .specify memory
- [ ] #4 Sweep doctrine updated: the hand-authored-specs escape line retired from future runbooks (pdlc:sweep precondition gate satisfied by .specify/ presence)
- [x] #5 Spec phase: Install Spec Kit tooling
- [x] #6 Spec phase: Reconcile templates and verify bridge derivation
- [x] #7 Spec phase: Record constitution state
- [ ] #8 Spec phase: Retire the escape line from sweep doctrine
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Runbook docs/design/speckit-install-runbook.md (signed off 2026-09-11). Phases 1-3 dispatch at sonnet (cc/claude-sonnet-5[1m], default tier: work to a written spec); phase 4 at opus (cc/claude-opus-5[1m], fallback cc/claude-opus-4-8[1m]) — SKILL.md doctrine prose per TASK-86/87/88 precedent, escalation operator-signed at runbook sign-off. Spec: specs/067-speckit-install.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5
Phase 1 done (commit f7cecdc): specify init 0.12.5.dev0 installed .specify/ (templates, scripts, memory, workflows) and 10 speckit skills at .claude/skills/speckit-*/; no house files touched. Orchestrator call: phases 2+3 grouped in one sonnet dispatch per plan.md's grouping allowance.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5
Phases 2+3 done (b8fa70b, bfd04b0): templates reconciled (board-task header; phased tasks template already bridge-shaped), bridge derivation verified Pass against a scratch dir (recorded in specs/067-speckit-install/bridge-verification.md), constitution recorded unratified per operator decision. Phase 4 (opus) next.
<!-- SECTION:NOTES:END -->
