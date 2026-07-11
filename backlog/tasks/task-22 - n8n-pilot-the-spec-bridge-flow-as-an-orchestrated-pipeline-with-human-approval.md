---
id: TASK-22
title: >-
  n8n pilot: the spec-bridge flow as an orchestrated pipeline with human
  approval
status: Done
assignee:
  - '@claude'
created_date: '2026-07-11 01:30'
updated_date: '2026-07-11 04:10'
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
- [x] #1 One full pilot run: trigger to merged-or-approved outcome on a fixture repo, with the board reconciled by the planner node and Done promoted only via the human approval node
- [x] #2 Gate node runs npx @praxisflux/gates and a forced failure demonstrably loops stderr back into the agent node with bounded retries
- [x] #3 Workflow JSON + checkout-service artifacts committed (or attached to the task) with a README explaining each node tier
- [x] #4 A findings note compares n8n vs GHA-environments vs Temporal for this flow — input to the orchestration presentation
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

All four ACs proven live. Three workflow runs (all approved by evan via the Wait-node resume URL — a real human each time): (1) exceeds fixture — gate FAIL, agent repair from the gate's verbatim failure text (6 turns/$0.61), gate PASS, approved, commit; (2) the tamagotchi — REAL project on a pilot branch, agent implemented T001 headlessly (14 turns/$1.38), gate-verified, human inspection caught the pet.json runtime-state leak before approving, merged --no-ff to main (d88c7e7); (3) done-eligible fixture — sync derived Done inside the pipeline (final summary verbatim), human approved the landing. AC#2 letter: gate step switched to npx -y @praxisflux/gates (the published artifact) and re-verified fail->repair->pass directly. Findings: n8n earns exactly the human seam (Wait node + execution visibility); chassis is orchestrator-independent by construction; pure-sync rounds are tier-1-able (reconcile endpoint = future optimization); the approval window catches what no gate checks (spec gap: runtime state hygiene). Deliverables in docs/orchestration/ + course at docs/courses/TASK-22. n8n container + runner left running for exploration.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The spec-bridge flow ran under external orchestration (n8n in Docker, sequencing + human pause only) with a ~150-line host runner exposing whitelisted steps (/checkout /agent /gate /notify /finish). Three live runs, each landed only through a real human posting approval to the parked Wait node: forced-failure corrective loop (gate's verbatim failure text as the agent's repair prompt, bounded rounds), real creative work (the tamagotchi TUI's T001 implemented headlessly on a pilot branch and merged --no-ff after human inspection), and Done promotion (derived by sync in-pipeline, human-approved landing). Gate node consumes the published npm artifact (npx @praxisflux/gates). Deliverables: workflow.json, runner.mjs, README (tier architecture), run-log.md (all scenarios), findings.md (n8n vs GHA vs Temporal — n8n earns the human seam; the chassis is orchestrator-independent by construction). Per-task course at docs/courses/TASK-22. Total model spend across the pilot ~$3.30.
<!-- SECTION:FINAL_SUMMARY:END -->
