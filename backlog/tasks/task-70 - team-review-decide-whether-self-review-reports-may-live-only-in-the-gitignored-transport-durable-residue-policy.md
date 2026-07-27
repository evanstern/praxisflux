---
id: TASK-70
title: >-
  team-review: decide whether self-review reports may live only in the
  gitignored transport (durable-residue policy)
status: To Do
assignee: []
created_date: '2026-07-27 04:33'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-61 (PR #84) moved team-review's default report path under the runs home — on a self-review that is the target's own gitignored .handoff/ transport, so the report (the review's durable deliverable) is untracked in that one case. The loud self-review WARN at begin tells the operator where it lands, and an explicit --report elsewhere still works; but the repo's handoff principle says transport is gitignored while EVIDENCE lives in tracked state — is a review report evidence (must be durable/tracked) or a transient deliverable the operator relocates when they care? Decide the policy and make the plugin match: either (a) bless the current behavior and state it in SKILL.md + the team-review-plugin wiki note as the recorded rule, or (b) route self-review defaults to a tracked location (or copy-on-finish) without reintroducing the in-target gate deadlock TASK-61 fixed. The run record already lives durably either way. Origin: policy question parked by TASK-61 during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The residue policy is decided and recorded (SKILL.md + docs/wiki/team-review-plugin.md state one rule)
- [ ] #2 Behavior matches the recorded rule; if (b), the self-review round trip still passes on pure defaults (no gate deadlock regression)
- [ ] #3 Existing TASK-61 tests stay green; any new behavior is covered by a test
<!-- AC:END -->
