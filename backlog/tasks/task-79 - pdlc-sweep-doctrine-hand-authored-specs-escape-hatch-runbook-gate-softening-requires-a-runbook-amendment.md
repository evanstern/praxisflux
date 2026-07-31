---
id: TASK-79
title: >-
  pdlc:sweep doctrine: hand-authored-specs escape hatch; runbook-gate softening
  requires a runbook amendment
status: To Do
assignee: []
created_date: '2026-07-27 16:26'
updated_date: '2026-07-31 12:46'
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
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 sweep precondition gate states the hand-authored-specs escape hatch and its recording requirement
- [ ] #2 concurrency/checkpoint doctrine states the runbook-amendment rule for gate softening
- [ ] #3 skill version bump + marketplace bump; pdlc-sweep note re-verified; gates green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-28: see TASK-84 — the inverse case. TASK-79 widens what the precondition gate PERMITS (hand-authored specs when .specify/ is absent); TASK-84 narrows what goes UNNOTICED (full cycle chosen, .specify/ present, loop still degraded to a claim stub). Verify the two fixes do not contradict.

2026-07-31 (TASK-84 cross-ref): TASK-84 shipped R4's escape-line Output gate (sweep skill 0.13.0, marketplace 0.44.0): every scoped task's specs/NNN-*/ must contain spec+plan+tasks OR the runbook must record an operator-signed escape line naming the task and what stands in for the artifacts. Non-contradiction verified: TASK-79 widens what the precondition gate PERMITS (hand-authored specs when .specify/ is absent, recorded in the runbook), and R4's wording already reads that recorded sanction as one INSTANCE of the escape line — so implement AC #1's recording requirement as exactly such an escape line in the runbook's 'Per-task artifacts required before PR' section, never as a second mechanism.
<!-- SECTION:NOTES:END -->
