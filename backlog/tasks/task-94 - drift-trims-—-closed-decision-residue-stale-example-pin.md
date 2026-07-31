---
id: TASK-94
title: drift trims — closed-decision residue + stale example pin
status: To Do
assignee: []
created_date: '2026-07-31 20:04'
labels:
  - debt
  - pdlc-refactor-triage
dependencies: []
priority: medium
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-18-47-56, findings 10+11 + minor item (c) (report: docs/reviews/team-review-praxis-2026-07-31-18-47-56.md; triage record: docs/reviews/refactor-triage-praxis-2026-07-31-18-47-56.md).

Evidence: (11) pdlc/skills/refactor-triage/SKILL.md:26-27 and docs/wiki/pdlc-refactor-triage.md:81 still advertise range-aware orient.mjs as a live follow-up — TASK-77 closed it not-needed (operator, 2026-07-31, PR #108) with a re-card trigger. (10) SKILL.md:69-70 claims last-run-at is 'the machine-findable line every record carries' — false for all pre-0.3.0 records; reword to records ≥0.3.0 (the STOP path already handles absence honestly). (c) action.yml:7's illustrative comment says uses: evanstern/praxisflux@v0.4.0, seven-plus releases stale — the enumeration-drift shape TASK-74 fixed elsewhere.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 orient.mjs follow-up clause states closed-not-needed + the re-card trigger (SKILL + wiki mirror)
- [ ] #2 mode (d) wording scoped to records written under ≥0.3.0
- [ ] #3 action.yml example comment updated or made version-agnostic
- [ ] #4 refactor-triage skill version bump + lockstep
<!-- AC:END -->
