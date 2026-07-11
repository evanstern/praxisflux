---
id: TASK-22
title: >-
  n8n pilot: the spec-bridge flow as an orchestrated pipeline with human
  approval
status: To Do
assignee: []
created_date: '2026-07-11 01:30'
labels: []
dependencies:
  - TASK-20
priority: medium
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
decision-1's pilot, updated for the three-tier node taxonomy (deterministic CLI / agent / human) that TASK-9.7 validated. Build the minimal n8n workflow that runs the spec-driven loop against a real repo: trigger (webhook or manual) -> checkout service (container/worktree with the repo + backlog) -> agent node (headless skill run per TASK-20's recipe) -> gate node (npx @praxisflux/gates, failure stderr looped back to the agent as the corrective prompt, bounded retries) -> planner node (spec-bridge plan | sh to reconcile the board) -> human approval node (Done-eligible -> Done promotion) -> commit/push/PR. Deliverables: the exported n8n workflow JSON, the checkout-service script/container it calls, and a run log of one full pass including a gate-failure -> corrective-loop iteration. Depends on TASK-20 (the agent node recipe). Document what n8n was good/bad at vs alternatives (GHA environments, Temporal) as input to the presentation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One full pilot run: trigger to merged-or-approved outcome on a fixture repo, with the board reconciled by the planner node and Done promoted only via the human approval node
- [ ] #2 Gate node runs npx @praxisflux/gates and a forced failure demonstrably loops stderr back into the agent node with bounded retries
- [ ] #3 Workflow JSON + checkout-service artifacts committed (or attached to the task) with a README explaining each node tier
- [ ] #4 A findings note compares n8n vs GHA-environments vs Temporal for this flow — input to the orchestration presentation
<!-- AC:END -->
