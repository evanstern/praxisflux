---
id: TASK-94
title: drift trims — closed-decision residue + stale example pin
status: To Do
assignee: []
created_date: '2026-07-31 20:04'
updated_date: '2026-09-14 13:42'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#1 NARROWED (operator ratification, 2026-09-14, pre-sweep board prune).

Re-verified all three trims against HEAD 3c696f1. Two are unchanged; one has partly drifted and is narrowed rather than dropped.

AC#1 (orient.mjs residue) — PARTLY OVERTAKEN, still real. The card said SKILL.md:26-27 and the wiki mirror 'advertise range-aware orient.mjs as a live follow-up'. The prose has since softened: pdlc/skills/refactor-triage/SKILL.md:25-27 now reads '(Range-aware orient.mjs is a possible evidence-backed follow-up, not this skill's job.)' and docs/wiki/pdlc-refactor-triage.md:82 similarly hedges. So it no longer reads as a live commitment — but it still does NOT state what TASK-77 actually decided. NARROWED SCOPE: state the closed-not-needed ruling and its re-card trigger, i.e. that TASK-77 closed this as not-needed by operator sign-off (2026-07-31, PR #108) on two clean counter-datapoints with zero observed hampers, re-card on a demonstrated hamper. A reader today cannot tell the question was settled; that is the residue worth removing.

AC#2 (last-run-at overclaim) — UNCHANGED, still false. pdlc/skills/refactor-triage/SKILL.md:69 still calls last-run-at 'the machine-findable line every record carries', which is untrue for all pre-0.3.0 records. Reword to records written under >=0.3.0. (The STOP path at :70-74 already handles absence honestly, so this is a wording fix, not a behavior change.)

AC#3 (stale example pin) — UNCHANGED, still stale. action.yml:6 still reads 'uses: evanstern/praxisflux@v0.4.0' in its illustrative comment, many releases behind. Prefer making it version-agnostic over bumping it to a number that will restale — same enumeration-drift shape TASK-74 fixed elsewhere.

AC#4 (version bump + lockstep) unchanged: refactor-triage skill version bump plus the marketplace lockstep, since this touches released surface.
<!-- SECTION:NOTES:END -->
