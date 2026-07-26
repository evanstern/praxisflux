---
id: TASK-43
title: 'Dogfood pdlc:bootstrap on the praxisflux repo itself'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-23 17:28'
updated_date: '2026-07-26 14:51'
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
- [x] #1 .handoff/ is gitignored at the repo root (transport never clutters git status), making the CLAUDE.md claim true
- [x] #2 pdlc:bootstrap has been run on the repo: .pdlc sentinel present, PDLC grounding block planted into the existing CLAUDE.md with all hand-written content preserved (append, never clobber)
- [x] #3 A team-review self-review of praxis completes begin -> finish cleanly as the end-to-end verification (pairs with the gate-fix task if it lands first)
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
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

Implemented: .handoff/ gitignored (no tracked residue existed); plant.mjs --peer backlog appended the pdlc:grounding block (byte-level append proven: original 5452 bytes identical as prefix; +83/-0), .pdlc sentinel {0.17.0, backlog}; second run idempotent (unchanged/unchanged, --check exit 0); self-review task-43-2026-07-26-14-48-50 begin/finish both exit 0 on untouched target (escalated WARN correctly absent — .handoff now ignored); overview.md re-verified + re-pinned. Dogfood findings recorded in spec tasks.md: (1) deterministic planter is peer-silent (absent-peer recommendation lives only in SKILL.md prose, no deterministic trace); (2) PROJECT_NAME from basename(root) with no --name override — worktree plants would bake the wrong name (worked around via scratch symlink). 169 tests, check-docs, wiki-freshness green; docs+config-only diff, no bumps.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
praxis is now itself PDLC-bootstrapped: .handoff/ gitignored (the CLAUDE.md claim is finally true), the pdlc:grounding block planted into the hand-rolled CLAUDE.md with byte-level append-only proof (+83/-0, original preserved as identical prefix) and second-run idempotence, .pdlc sentinel {0.17.0, peers: [backlog]}, and an end-to-end team-review self-review (task-43-2026-07-26-14-48-50) completing begin->finish exit 0 — exercising the TASK-42 fix. Two dogfood findings recorded in specs/010 tasks.md for possible follow-ups: the deterministic planter is peer-silent about absent Spec Kit, and PROJECT_NAME derives from basename(root) with no override (worktree-plant trap). Docs+config-only, no bumps.
<!-- SECTION:FINAL_SUMMARY:END -->
