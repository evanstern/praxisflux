---
id: TASK-79
title: >-
  pdlc:sweep doctrine: hand-authored-specs escape hatch; runbook-gate softening
  requires a runbook amendment
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 16:26'
updated_date: '2026-07-31 18:06'
labels:
  - debt
dependencies: []
priority: low
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-27-16-07-29 — triage record docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md (group F; report §improved 9 + the process half of 6), evaluation report docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

Evidence: pdlc/skills/sweep/SKILL.md:35 says missing .specify/ → stop, yet three sweeps have overridden it by recorded host precedent (board-clearing → downstream-bugfix → sweep-followups, cited again by docs/design/refactor-triage-runbook.md:75): hand-authored specs/NNN/{spec,plan,tasks}.md is de facto sanctioned doctrine pretending to be an exception. Separately, specs/033-refactor-triage/plan.md softened the signed-off runbook's root-README gate (docs/design/refactor-triage-runbook.md:96) to 'only if check-docs demands' with no runbook amendment, though runbook deviations are defined as operator checkpoints (the stale row itself is TASK-74's fix).

Fix as sweep 0.10.0: (1) precondition gate learns the escape hatch — .specify/ absent is acceptable when the host has an established hand-authored-spec precedent, recorded in the runbook; (2) doctrine sentence: plan-time softening of any signed-off runbook gate is a runbook amendment + operator ping, not an implementer decision note.

Spec: specs/045-sweep-hand-authored-specs-hatch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 sweep precondition gate states the hand-authored-specs escape hatch and its recording requirement
- [x] #2 concurrency/checkpoint doctrine states the runbook-amendment rule for gate softening
- [x] #3 skill version bump + marketplace bump; pdlc-sweep note re-verified; gates green
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-28: see TASK-84 — the inverse case. TASK-79 widens what the precondition gate PERMITS (hand-authored specs when .specify/ is absent); TASK-84 narrows what goes UNNOTICED (full cycle chosen, .specify/ present, loop still degraded to a claim stub). Verify the two fixes do not contradict.

2026-07-31 (TASK-84 cross-ref): TASK-84 shipped R4's escape-line Output gate (sweep skill 0.13.0, marketplace 0.44.0): every scoped task's specs/NNN-*/ must contain spec+plan+tasks OR the runbook must record an operator-signed escape line naming the task and what stands in for the artifacts. Non-contradiction verified: TASK-79 widens what the precondition gate PERMITS (hand-authored specs when .specify/ is absent, recorded in the runbook), and R4's wording already reads that recorded sanction as one INSTANCE of the escape line — so implement AC #1's recording requirement as exactly such an escape line in the runbook's 'Per-task artifacts required before PR' section, never as a second mechanism.

2026-07-31 dispatch (board-cost-test sweep): tier default-implementer, pinned claude-opus-4-8 via .claude/agents/opus-implementer.md agent definition. Justification: doctrine prose composing with TASK-84's escape-line mechanism; no code. Grouping call: single dispatch covers Implement+Prove.

2026-07-31 implement+prove (dispatched, opus-implementer): R1 precondition gate carves the recorded-precedent case as ONE escape-line instance (TASK-84 clause cited); no template touch — slot example already implies host-precedent sanction. R2 gate-softening = runbook-amendment-plus-ping rule added to operator checkpoints (specs/033 case cited). R3 sweep skill 0.15.0->0.16.0, marketplace 0.49.0->0.50.0 via sync-version.mjs. Wiki: pdlc-sweep.md amended+re-pinned (NEEDS-REVIEW); pdlc-sweep-history.md reviewed (prose intact, 0.50.0 entry precluded by over-budget) + 11 lockstep siblings RE-PIN-ONLY, all re-pinned to de324a7. Gates green: node --test 252 pass, check-docs, freshness 34 fresh. Commits de324a7, 8df4691. NOT merged; T007/status left for close.
<!-- SECTION:NOTES:END -->
