---
id: TASK-61
title: >-
  team-review: self-review deadlocked by its own default report path; same-day
  report collisions
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 01:57'
updated_date: '2026-07-27 02:33'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
(live) scripts/run.mjs:53 defaults the report to join(process.cwd(), team-review-<target>-<date>.md); on a self-review (begin . from inside the target — a case the skill sanctions) that path is inside the target, and gates/review.mjs:104-105 unconditionally blocks any report inside the reviewed repo. Reproduced: begin . then finish exits 2 with exactly that block; the only escape is having passed --report outside up front. In a git target the in-repo report also trips the porcelain-drift check. skills/team-review/SKILL.md:38-39 compounds it by asserting the default is never inside the target — false whenever cwd == target. Related: the date-keyed default filename collides across two same-day runs of one target; reorient already fixed this class run-id-keyed (reorient/scripts/run.mjs:163-165).

Spec: specs/021-team-review-report-path
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 begin . resolves the default report path outside the target and finish passes on a self-review
- [ ] #2 SKILL.md report-path claim matches actual behavior
- [ ] #3 Default report filenames are unique per run (run-id or equivalent), not date-keyed
- [ ] #4 Self-review round-trip covered by a test
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 021-team-review-report-path (hand-authored spec/plan/tasks on branch task-61-team-review-report-path) drives. 1. run.mjs: default report path resolves OUTSIDE the target when cwd == target (e.g. TEAM_REVIEW_HOME or the runs dir), run-id-keyed filename instead of date-keyed (steal reorient's fix). 2. SKILL.md claim corrected to match behavior. 3. Self-review begin-.-then-finish round-trip test. 4. Versions + wiki re-ground (team-review-plugin note) + gates. See specs/021-team-review-report-path/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane C): tier = default implementer — scoped script/gate fix with a live repro; reorient's run-id-keyed pattern is the named prior art.
<!-- SECTION:NOTES:END -->
