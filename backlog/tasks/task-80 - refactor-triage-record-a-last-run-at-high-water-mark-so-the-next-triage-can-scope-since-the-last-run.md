---
id: TASK-80
title: >-
  refactor-triage: record a last-run-at high-water mark so the next triage can
  scope 'since the last run'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 17:32'
updated_date: '2026-07-31 17:31'
labels:
  - pdlc
dependencies: []
priority: medium
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Today the triage scope is always explicit (--range xxx..yyy or whole-repo): nothing records how far the last run scanned, so a post-sweep triage scoped to the new sweep's range silently skips any merges between the previous triage and that sweep's base — the operator must remember to widen the range by hand (this bit on 2026-07-27: the TASK-73 sweep merged b4e8e09..52b5abd after triage run praxis-2026-07-27-16-07-29, and only an operator reminder got it scanned). Fix: each refactor-triage run durably records the commit id its scan reached (last-run-at) — natural home is the tracked triage record in docs/reviews/, machine-findable — and the skill's Scope phase gains a "since last triage" entry: resolve the most recent record's last-run-at and use <that-id>..HEAD as the range, stopping (not guessing) when no prior record exists. Related: TASK-75 (0.2.0 hardening — same record surface; the run-id rule slice could carry this) and TASK-77 (orient.mjs --since is the eval engine's view, NOT this bookkeeping — do not conflate).

Spec: specs/042-refactor-triage-last-run-at
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every refactor-triage run writes a machine-findable last-run-at commit id into its tracked triage record (format documented in the skill)
- [ ] #2 Scope phase supports 'since last triage': resolves the latest record's last-run-at to <id>..HEAD, verifies the range resolves, and stops with a clear message when no prior record exists
- [ ] #3 Skill version bumped per docs/releasing.md; node --test and check-docs green; wiki note pdlc-refactor-triage re-verified against the diff and re-pinned
- [x] #4 Spec phase: Spec
- [ ] #5 Spec phase: Implement
- [ ] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier default-implementer, pinned claude-opus-4-8 via .claude/agents/opus-implementer.md agent definition (Agent tool model param proven unreliable this session — see runbook). Justification: skill-contract prose insertions into a settled surface, no code. Grouping call: single dispatch covers Implement+Prove (TASK-84 precedent).
<!-- SECTION:NOTES:END -->
