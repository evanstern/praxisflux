---
id: TASK-22
title: >-
  n8n pilot: the spec-bridge flow as an orchestrated pipeline with human
  approval
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-11 01:30'
updated_date: '2026-07-11 03:45'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Architecture: n8n in Docker (orchestrator only); a zero-dep node runner service on the host exposing whitelisted steps as HTTP endpoints — POST /checkout (generate the scratch target project; two fixtures: 'lagging' and 'exceeds'), POST /agent (claude -p headless per docs/headless-runner.md, corrective prompt support), POST /gate (spec-bridge check + plan-empty verdict by artifacts), POST /approve-finish (records the human decision). n8n reaches it at host.docker.internal.
2. Workflow (exported JSON): webhook trigger -> checkout -> gate -> IF fail -> agent(with gate stderr) -> gate again (bounded retries via attempt counter) -> Wait node (human approval webhook) -> finish. The forced-failure demo is REAL: the 'exceeds' fixture makes the first gate fail, the corrective loop fixes it via the agent.
3. Run it: one full pass incl. the gate-failure iteration and the human approval resume; save the run log.
4. Deliverables under docs/orchestration/n8n-pilot/: workflow.json, runner.mjs, fixture generator, README (node tiers explained), run-log.md; findings note comparing n8n vs GHA-environments vs Temporal.
5. Per-task course docs/courses/TASK-22; finalize + PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User-directed fixture upgrade: the pilot target is a REAL mini project — a tamagotchi TUI at ~/Claude/Code/tamagotchi (persistent, super simple to start) with a genuine Spec Kit spec; the agent node implements actual tasks.md items headlessly, not just board sync. The scratch 'exceeds' fixture stays for the forced-failure corrective-loop demo.
<!-- SECTION:NOTES:END -->
