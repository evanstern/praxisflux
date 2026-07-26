---
id: TASK-43
title: 'Dogfood pdlc:bootstrap on the praxisflux repo itself'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-23 17:28'
updated_date: '2026-07-26 14:41'
labels: []
dependencies: []
references:
  - >-
    backlog/docs/reviews/doc-1 -
    Team-review-2026-07-23-—-praxisflux-vs-its-own-tenets.md
priority: medium
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Team-review gap #2 (doc-1): the suite enforces its tenets downstream more strictly than at home — praxis has no .pdlc sentinel, a hand-rolled CLAUDE.md, and an un-gitignored .handoff/ despite CLAUDE.md claiming the transport is gitignored. Running the bootstrap on the marketplace repo is also the strongest proof of its idempotent-append claim (plant markers into an existing, heavily customized CLAUDE.md without clobbering it). Related: the self-review gate fix task removes the sharpest symptom, but the root cause is this un-bootstrapped state.

Spec: specs/010-bootstrap-dogfood
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 .handoff/ is gitignored at the repo root (transport never clutters git status), making the CLAUDE.md claim true
- [ ] #2 pdlc:bootstrap has been run on the repo: .pdlc sentinel present, PDLC grounding block planted into the existing CLAUDE.md with all hand-written content preserved (append, never clobber)
- [ ] #3 A team-review self-review of praxis completes begin -> finish cleanly as the end-to-end verification (pairs with the gate-fix task if it lands first)
- [ ] #4 Spec phase: Spec
- [ ] #5 Spec phase: Implement
- [ ] #6 Spec phase: Prove
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 010-bootstrap-dogfood (hand-authored)
2. spec-bridge:link
3. Dispatch: gitignore .handoff/ at root; run pdlc:bootstrap plant on the repo (append-only into existing CLAUDE.md, .pdlc sentinel); end-to-end team-review self-review begin->finish as verification (1.1.0 fix just merged)
4. Gates; wiki re-pins as flagged; PR; serial merge vs TASK-34 (smaller first)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 2 (docs/design/board-clearing-runbook.md). Tier: default implementer (dogfood run + reconciliation). Checkpoint armed: if the plant would rewrite existing CLAUDE.md prose beyond appending its marked block, STOP and surface the diff to the operator.
<!-- SECTION:NOTES:END -->
