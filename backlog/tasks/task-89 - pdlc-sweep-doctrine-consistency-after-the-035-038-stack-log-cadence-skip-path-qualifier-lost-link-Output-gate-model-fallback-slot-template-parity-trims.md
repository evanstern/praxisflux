---
id: TASK-89
title: >-
  pdlc:sweep doctrine consistency after the 035-038 stack: log cadence,
  skip-path qualifier, lost-link Output gate, model fallback slot, template
  parity, trims
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-31 15:22'
updated_date: '2026-07-31 16:47'
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
- [ ] #1 step 5 gains the dispatch-boundary log-row clause; step 10 and the template state the same cadence (F1)
- [ ] #2 the 'non-trivial' qualifier is removed or routed through the escape line (F2)
- [ ] #3 Output gate re-checks every scoped card's Spec marker at sweep end; template end-check matches (F3)
- [ ] #4 Phase 1 item 2 gains the fallback-ID slot (record fallback for subscription-unavailability + which model actually served) (F4)
- [ ] #5 template escape-line section carries the never-a-second-mechanism clause (F6)
- [ ] #6 T1/T2 redundancies trimmed without dropping any spec-mandated rationale
- [ ] #7 skill version bump + marketplace bump; pdlc-sweep note re-verified; gates green
<!-- AC:END -->
