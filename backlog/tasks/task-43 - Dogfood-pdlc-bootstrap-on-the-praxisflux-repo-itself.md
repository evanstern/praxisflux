---
id: TASK-43
title: 'Dogfood pdlc:bootstrap on the praxisflux repo itself'
status: To Do
assignee: []
created_date: '2026-07-23 17:28'
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
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 .handoff/ is gitignored at the repo root (transport never clutters git status), making the CLAUDE.md claim true
- [ ] #2 pdlc:bootstrap has been run on the repo: .pdlc sentinel present, PDLC grounding block planted into the existing CLAUDE.md with all hand-written content preserved (append, never clobber)
- [ ] #3 A team-review self-review of praxis completes begin -> finish cleanly as the end-to-end verification (pairs with the gate-fix task if it lands first)
<!-- AC:END -->
