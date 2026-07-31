---
id: TASK-75
title: >-
  refactor-triage 0.2.0 hardening: tracked-report fallback, headless policy
  syntax, run-id rule, enforce 'both tracked'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 16:25'
updated_date: '2026-07-31 16:53'
labels:
  - debt
dependencies: []
priority: medium
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-27-16-07-29 — triage record docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md (group B; report §improved 2–4), evaluation report docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

Evidence: pdlc/skills/refactor-triage/SKILL.md:72 asserts team-review lands a tracked report at docs/reviews/ on self-review — true only for team-review ≥0.39.0 (copy-on-finish, TASK-70) on the default path; older siblings strand the report in gitignored .handoff/ (manifested live on this run: engine cache 0.36.0, lead copied manually). SKILL.md:19 promises 'both tracked' but the output gate (:132) only enforces the triage record; inline-degraded mode names no report home. Headless mode (:56) has doctrine but no syntax — no policy arg named, pdlc/README.md shows two of three mode examples, no headless-vs-operator detection rule. run-id (:102) undefined when team-review didn't run.

Fix as skill 0.2.0: (1) landing becomes a check with fallback — 'if no tracked copy landed, copy the proven report to docs/reviews/ and commit it'; (2) name the policy argument, add the third README example, state the detection rule; (3) run-id = team-review's run id when it ran, else <repo>-<ISO-stamp>; (4) output gate enforces the evaluation report's trackedness or 'both tracked' is dropped.

Spec: specs/040-refactor-triage-hardening
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Evaluate phase states the tracked-copy check + manual-copy fallback (no version coupling)
- [ ] #2 headless mode has a named policy argument, a README example, and a detection rule
- [ ] #3 run-id minting rule stated for both engine and degraded modes
- [ ] #4 output gate enforces evaluation-report trackedness (or the 'both tracked' promise is removed)
- [ ] #5 skill version 0.2.0 + marketplace bump; gates green
- [x] #6 Spec phase: Spec
- [ ] #7 Spec phase: Implement
- [ ] #8 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier default-implementer, pinned claude-opus-5, fallback claude-opus-4-8 per operator ruling 2026-07-31 (Agent param opus; subscription resolves — record actual). Justification: skill-contract prose with a cross-plugin path contract, no code. Grouping call: single dispatch covers Implement+Prove (small interlocked phases; TASK-84 precedent); second fresh dispatch only if the first ends heavy.
<!-- SECTION:NOTES:END -->
