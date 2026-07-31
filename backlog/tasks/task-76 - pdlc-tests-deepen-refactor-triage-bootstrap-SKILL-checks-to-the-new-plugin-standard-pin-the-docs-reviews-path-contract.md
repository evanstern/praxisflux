---
id: TASK-76
title: >-
  pdlc tests: deepen refactor-triage/bootstrap SKILL checks to the new-plugin
  standard; pin the docs/reviews path contract
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 16:26'
updated_date: '2026-07-31 18:06'
labels:
  - debt
dependencies:
  - TASK-75
priority: low
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-27-16-07-29 — triage record docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md (group C; report §improved 5), evaluation report docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

Evidence: test/pdlc.test.mjs:41-63 — the three TASK-72 tests enforce four tokens and two headers; phases 2–4 of the skill (R3–R6: engine orchestration, triage record path, the Execute contract) could be gutted with tests green. Sibling standard test/new-plugin.test.mjs:67-73 asserts the full four-section skeleton and uses parseFrontmatter (the pdlc tests use a raw regex pinned to exact key order). The cross-skill path contract (refactor-triage SKILL.md:74 hardcodes team-review's docs/reviews/team-review-<run-id>.md — team-review/skills/team-review/SKILL.md:30) is pinned by no test. The new description assertion (test/pdlc.test.mjs:46) was never backported to the bootstrap test (:36-39).

Depends on TASK-75: the hardened 0.2.0 prose is what the deepened tests should pin — write them after it lands.

Spec: specs/047-pdlc-test-deepening
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 refactor-triage SKILL tests assert the four-section skeleton and parse frontmatter via parseFrontmatter
- [x] #2 phase-content anchors: triage-record path string, backlog-CLI-only Execute, lens framing present
- [x] #3 a test pins refactor-triage's and team-review's docs/reviews path spelling to agree
- [x] #4 bootstrap frontmatter test gains the description assertion; node --test green
- [x] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier sonnet, pinned claude-sonnet-5 via .claude/agents/sonnet-implementer.md agent definition (operator-approved at runbook sign-off, PR #108). Justification: test-authoring to an existing sibling standard (new-plugin.test.mjs), mechanical. Grouping call: single dispatch covers Implement+Prove.
<!-- SECTION:NOTES:END -->
