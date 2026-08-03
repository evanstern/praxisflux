---
id: TASK-100
title: 'Gate: a ticked tasks.md checkbox must not outrun a red project gate'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 18:11'
updated_date: '2026-08-03 01:52'
labels:
  - debt
  - pdlc
  - spec-bridge
  - doctrine
dependencies: []
priority: high
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A dispatched implementer reported "node --test — 254 pass, 0 fail" and ticked its tasks.md `node --test green` checkbox while four wiki notes were already staled and the freshness gate was red. Nothing caught it. The next phase's agent noticed only because it re-ran the suite and saw 258/259 with a failure the previous phase had claimed did not exist.

Observed 2026-08-01 during the TASK-91 sweep (spec 048, PR #122), phases 1-2. The tick was corrected by hand in specs/048-bootstrap-tier-rubric/tasks.md, and the per-phase boxes were qualified in prose — but prose is not a gate, and the next sweep's implementer will not read this one's tasks.md.

Why it matters: "status can never exceed the artifacts that prove it" is the repo's gates principle, and a ticked tasks.md checkbox IS status — spec-bridge derives the board card's phase ACs and its status from exactly those boxes. A green tick over a red gate is the precise failure the gates convention exists to make impossible, and it propagates: the bridge will happily derive Done-eligible from boxes that were never true.

Two things are tangled and should be separated by the fix:
(1) The freshness gate is red BY CONSTRUCTION from the first commit that touches a pinned source until the re-pin commit lands. That is correct sequencing (re-pin only after the commit that touched the sources), not a regression — so a naive "block any tick while any gate is red" rule would make phased work impossible.
(2) What is NOT acceptable is a phase claiming a gate is green when it is red, or a task reaching Done-eligible while a gate the project enforces is failing.

Fix shape (not prescriptive — the spec decides): a check that reconciles ticked tasks.md checkboxes against actual gate state, with an explicit notion of which gates a phase is allowed to leave red and which must be green before the FINAL phase can tick. The spec-bridge gate is the natural home: it already reads tasks.md and already blocks status that exceeds artifacts. Candidate rule: a spec whose boxes are all ticked (Done-eligible) while any project gate is red is a blocking finding.

Spec: specs/050-tick-vs-red-gate
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A gate detects the state 'tasks.md checkboxes ticked while a project gate this repo enforces is red' and blocks, naming the phase, the box, and the failing gate
- [ ] #2 Phased work stays possible: the check distinguishes gates that are red by construction mid-PR (wiki freshness between a source edit and its re-pin commit) from gates that must be green, rather than blocking every tick while anything is red
- [ ] #3 Done-eligible derivation is covered: an all-boxes-ticked spec while any enforced gate fails is a blocking finding, so the bridge cannot derive Done from boxes that were never true
- [ ] #4 A test pins the new behavior, and the docs that describe the gates convention name the rule
- [ ] #5 Cites the 2026-08-01 field case (spec 048 phases 1-2: '254 pass, 0 fail' reported and ticked with four notes staled and the freshness gate red)
- [ ] #6 Spec phase: Phase 1 — Design decision and config surface
- [ ] #7 Spec phase: Phase 2 — The evaluator and its two entry points
- [ ] #8 Spec phase: Phase 3 — Tests, including the parity proof
- [ ] #9 Spec phase: Phase 4 — Dogfood, docs, and re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch (runbook: docs/design/gates-and-doctrine-sweep-runbook.md, Lane 1). Tier: default implementer. Model ID: claude-opus-4-8, pinned via .claude/agents/opus-implementer.md frontmatter (NOT the dispatch-call model param — silently ignored by this harness, 2026-07-31). Primary claude-opus-5 documented but not surfaced by the subscription (operator ruling C, 2026-08-02). Rubric justification: a genuine design call the card declines to make, extending the repo's central integrity rule into a new enforcement surface with an easy-to-get-wrong red-by-construction carve-out. Operator ruling A fixed home/config/posture at sign-off; R4's execution-timing choice remains the implementer's, to be recorded in the spec dir.
<!-- SECTION:NOTES:END -->
