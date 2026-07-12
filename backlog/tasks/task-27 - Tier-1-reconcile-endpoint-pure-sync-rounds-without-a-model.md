---
id: TASK-27
title: 'Tier-1 reconcile endpoint: pure-sync rounds without a model'
status: In Progress
assignee:
  - '@pipeline'
created_date: '2026-07-12 01:23'
updated_date: '2026-07-12 02:12'
labels: []
dependencies: []
priority: medium
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pilot finding: scenarios 1 and 3 spent ~$0.60 of model time on rounds that are now plan|sh — pure bookkeeping. Add POST /reconcile to the runner: run spec-bridge plan and execute its emitted commands deterministically (no claude session), then re-verify. Workflow ladder upgrade: Gate FAIL -> Reconcile -> Gate -> still FAIL -> Agent (the model becomes the escalation, not the default). The exceeds and done-eligible fixtures should complete with $0 model spend.

Spec: specs/001-reconcile-endpoint
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 POST /reconcile executes plan's emitted backlog commands verbatim (no model) and reports what it ran
- [ ] #2 Workflow tries Reconcile before any Agent round on gate failure; Agent remains the escalation for non-mechanical failures
- [ ] #3 exceeds and done-eligible fixture runs complete end-to-end with zero model cost, gate-verified
- [ ] #4 Run log/README updated with the new ladder
- [ ] #5 Spec phase: Endpoint
- [ ] #6 Spec phase: Proven
<!-- AC:END -->
