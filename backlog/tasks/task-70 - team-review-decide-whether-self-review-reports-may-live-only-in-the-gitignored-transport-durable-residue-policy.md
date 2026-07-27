---
id: TASK-70
title: >-
  team-review: decide whether self-review reports may live only in the
  gitignored transport (durable-residue policy)
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 04:33'
updated_date: '2026-07-27 14:15'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-61 (PR #84) moved team-review's default report path under the runs home — on a self-review that is the target's own gitignored .handoff/ transport, so the report (the review's durable deliverable) is untracked in that one case. The loud self-review WARN at begin tells the operator where it lands, and an explicit --report elsewhere still works; but the repo's handoff principle says transport is gitignored while EVIDENCE lives in tracked state — is a review report evidence (must be durable/tracked) or a transient deliverable the operator relocates when they care? Decide the policy and make the plugin match: either (a) bless the current behavior and state it in SKILL.md + the team-review-plugin wiki note as the recorded rule, or (b) route self-review defaults to a tracked location (or copy-on-finish) without reintroducing the in-target gate deadlock TASK-61 fixed. The run record already lives durably either way. Origin: policy question parked by TASK-61 during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.

Spec: specs/031-team-review-residue-policy
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The residue policy is decided and recorded (SKILL.md + docs/wiki/team-review-plugin.md state one rule)
- [x] #2 Behavior matches the recorded rule; if (b), the self-review round trip still passes on pure defaults (no gate deadlock regression)
- [x] #3 Existing TASK-61 tests stay green; any new behavior is covered by a test
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author spec 031-team-review-residue-policy (spec/plan/tasks). 2. Implement the operator-decided policy (b), sign-off 2026-07-27 (runbook docs/design/sweep-followups-runbook.md): self-review report defaults route to a TRACKED location (or copy-on-finish) — evidence lives in tracked state — without reintroducing the TASK-61 in-target gate deadlock. 3. Record the rule in team-review SKILL.md + docs/wiki/team-review-plugin.md. 4. TASK-61 tests stay green; new behavior covered by a test; gates + version bump + same-PR wiki re-pins.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch (runbook docs/design/sweep-followups-runbook.md): model tier = default implementer — policy recording + small routing change; the policy itself was decided by the operator at lane sign-off (choice b, tracked-by-default).

Implemented policy (b), tracked-by-default: pure-defaults self-review copy-on-finish — begin records trackedReport (docs/reviews/team-review-<run-id>.md), names it in stdout + the self-review WARN; finish copies strictly AFTER the output gate passes (TASK-61 deadlock fix intact) and records both paths. --report always wins (no copy); non-self-review flow unchanged; run records stay on the transport. Rule recorded in SKILL.md + docs/wiki/team-review-plugin.md. Tests: TASK-61 suite green; new test 'pure-defaults self-review lands a tracked copy on finish, recorded on the run; --report never copies'. Wiki honestly re-pinned (team-review-plugin -> 5b590ea, test-suite-catalog -> 541b28d). Version bumps deliberately left to the orchestrator.

spec-bridge sync: Spec: 2/2 · Implement: 4/4 · Prove: 2/2 — status In Progress → Done
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Spec: 2/2 · Implement: 4/4 · Prove: 2/2). Derived Done by spec-bridge sync. Shipped policy (b), operator-decided at sweep sign-off: a review report is evidence and lives tracked — pure-defaults self-review finish copies the proven report to docs/reviews/team-review-<run-id>.md after the output gate passes (no TASK-61 deadlock regression), --report never copies, rule recorded in SKILL.md (1.3.0) + team-review-plugin wiki note; delivered via PR on branch task-70-team-review-residue.
<!-- SECTION:FINAL_SUMMARY:END -->
