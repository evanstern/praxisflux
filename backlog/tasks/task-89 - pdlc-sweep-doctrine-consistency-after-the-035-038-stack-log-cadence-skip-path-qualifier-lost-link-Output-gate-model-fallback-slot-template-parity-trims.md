---
id: TASK-89
title: >-
  pdlc:sweep doctrine consistency after the 035-038 stack: log cadence,
  skip-path qualifier, lost-link Output gate, model fallback slot, template
  parity, trims
status: Done
assignee:
  - '@claude'
created_date: '2026-07-31 15:22'
updated_date: '2026-07-31 17:36'
labels:
  - pdlc-sweep
dependencies: []
priority: medium
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-11-12-22 over 9d5b81d..f3abebe (the two 2026-07-30/31 sweeps). Evaluation report: docs/reviews/team-review-sweep-close-84-2026-07-31-15-12-53.md; triage record: docs/reviews/refactor-triage-praxis-2026-07-31-11-12-22.md. Seven seam findings from stacking specs 035-038 into the same two files, accepted as one card (operator, 2026-07-31) because they edit the same two files and each is a one-clause fix:

F1 SKILL step 10 says one log line at merge (pdlc/skills/sweep/SKILL.md:241-242) while the template requires the in-flight row updated at each dispatch boundary (templates/runbook.md:149-153) — a SKILL-canonical session silently loses spec 036's phase-scoped resumability. F2 'every non-trivial task' (SKILL.md:27-28) predates 038 and leaks a cycle-skip with no escape line — the only sanctioned substitute is the operator-signed escape line (SKILL.md:329-333). F3 the Output gate (SKILL.md:328-336) never re-checks that each scoped card still carries its Spec marker at sweep end; the template end-check even scopes itself away from the link line (templates/runbook.md:66-67). F4 Phase 1 item 2 (SKILL.md:88-94) pins an explicit model ID with no availability-fallback slot — the operator's 2026-07-31 ruling (claude-opus-4-8 when claude-opus-5 is unavailable in the subscription) lives only in docs/design/speckit-degradation-runbook.md. F6 SKILL's 'never as a second mechanism' clause (SKILL.md:332-333) is missing from the template's escape-line section (templates/runbook.md:73-81). T1 doubled context-read rationale (SKILL.md:195-196 vs :207). T2 tier-note obligation stated twice (SKILL.md:93-94 vs :189).

Spec: specs/039-sweep-doctrine-consistency
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 step 5 gains the dispatch-boundary log-row clause; step 10 and the template state the same cadence (F1)
- [x] #2 the 'non-trivial' qualifier is removed or routed through the escape line (F2)
- [x] #3 Output gate re-checks every scoped card's Spec marker at sweep end; template end-check matches (F3)
- [x] #4 Phase 1 item 2 gains the fallback-ID slot (record fallback for subscription-unavailability + which model actually served) (F4)
- [x] #5 template escape-line section carries the never-a-second-mechanism clause (F6)
- [x] #6 T1/T2 redundancies trimmed without dropping any spec-mandated rationale
- [x] #7 skill version bump + marketplace bump; pdlc-sweep note re-verified; gates green
- [x] #8 Spec phase: Spec
- [x] #9 Spec phase: Implement
- [x] #10 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier default-implementer, pinned claude-opus-5, fallback claude-opus-4-8 per operator ruling 2026-07-31 (Agent param opus; subscription resolves — record actual). Justification: doctrine prose on a procedural skill against a precise seven-finding list, no code. Grouping call: single dispatch covers Implement+Prove (small interlocked phases; TASK-84 precedent); second fresh dispatch only if the first ends heavy.

2026-07-31 impl (opus-implementer, served claude-opus-4-8 — fallback per operator ruling 2026-07-31; note: harness launched this agent pinned to the task-74 worktree, switched into task-89 via EnterWorktree; Edit/Write tools stayed misrouted to task-74 so file edits were applied via Bash-driven exact string replacements): R1-R7 landed across SKILL.md + templates/runbook.md; skill 0.13.0->0.14.0, marketplace 0.44.0->0.45.0 (sync-version.mjs); pdlc-sweep.md + pdlc-sweep-history.md re-verified (NEEDS-REVIEW, amended, re-pinned; history kept to 7992/8000 by tightening the 0.44.0 entry); 11 lockstep notes re-pinned RE-PIN-ONLY (stamp-only). Gates green: node --test, check-docs, freshness (34 notes). Commits cf047ef, df2a0bc, e7da07c, 7defdc1.

spec-bridge sync: Spec: 2/2 · Implement: 7/7 · Prove: 3/3 — status In Progress → Done (PR #111, merge da9e0d4)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Spec: 2/2 · Implement: 7/7 · Prove: 3/3). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
