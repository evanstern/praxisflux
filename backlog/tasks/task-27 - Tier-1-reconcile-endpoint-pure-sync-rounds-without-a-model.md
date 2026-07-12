---
id: TASK-27
title: 'Tier-1 reconcile endpoint: pure-sync rounds without a model'
status: Done
assignee:
  - '@pipeline'
created_date: '2026-07-12 01:23'
updated_date: '2026-07-12 02:43'
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
- [x] #1 POST /reconcile executes plan's emitted backlog commands verbatim (no model) and reports what it ran
- [x] #2 Workflow tries Reconcile before any Agent round on gate failure; Agent remains the escalation for non-mechanical failures
- [x] #3 exceeds and done-eligible fixture runs complete end-to-end with zero model cost, gate-verified
- [x] #4 Run log/README updated with the new ladder
- [x] #5 Spec phase: Endpoint
- [x] #6 Spec phase: Proven
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. T001: add reconcile({runId}) to runner.mjs — plan → parse stdout (# lines context, 'backlog task edit ' lines commands, anything else throws) → bash -c each in run.dir → re-plan; return {ran, planEmpty, context}; register /reconcile in HANDLERS; header comment + tier map updated.
2. T002: workflow.json — Reconcile HTTP node + Gate R + Reconciled? IF between Proven 0? false branch and Agent 1; Agent 1 correction switches to Gate R failureText. Verify importable+activatable on a throwaway n8n container (production n8n-pilot container and :8787 runner untouched per run constraints).
3. T003: test-reconcile.sh — own runner on a random port; exceeds and done-eligible fixtures each: checkout → gate FAIL → /reconcile (ran non-empty, planEmpty true) → gate PASS; assert runner.log has zero agent lines for both runs (zero model spend). Run it green.
4. Docs: pilot README ladder diagram + prose gains the reconcile station; run-log.md addendum with the test-reconcile evidence. Check tasks.md boxes as proven, commit per slice (TASK-27 subject + Co-Authored-By), then /spec-bridge:sync.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
T001 landed: /reconcile on runner.mjs — plan → execute emitted 'backlog task edit' lines verbatim via bash -c (comments kept as context, any other stdout line throws) → re-plan; returns {ran, planEmpty, context}, one log line per phase. Smoke-verified on an exceeds fixture on a scratch runner (random port): gate FAIL → reconcile ran 5 commands, planEmpty=true → gate PASS, zero claude sessions.

T002 landed: workflow.json ladder — Reconcile + Gate R + Reconciled? between Proven 0? false branch and Agent 1; Agent 1 correction now carries Gate R's failure text. Import + activation verified on a throwaway n8n container (n8n import:workflow + update:workflow --active=true, then removed); the live n8n-pilot container and :8787 runner untouched per run constraints.
T003 landed: test-reconcile.sh green on a scratch runner (random port) — exceeds: gate FAIL → 5 plan commands → gate PASS; done-eligible: gate FAIL → 6 commands (incl. the Done promotion) → gate PASS; zero /agent lines in the runner log = $0 model spend. README ladder (diagram + reconcile-first bullet) and run-log addendum updated.

spec-bridge sync: Endpoint: 2/2 · Proven: 1/1 — status In Progress → Done
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Endpoint: 2/2 · Proven: 1/1). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
