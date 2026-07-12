---
id: TASK-30
title: 'Self-hosting: a praxisflux task developed through praxisflux''s own pipeline'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-12 01:24'
updated_date: '2026-07-12 03:56'
labels: []
dependencies:
  - TASK-26
priority: high
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The system develops itself under its own governance. Pick one small, real praxisflux feature; spec it with a Spec Kit dir in THIS repo (specs/NNN-*) linked to a board task via spec-bridge; run it through the n8n pipeline with the isolated runner (TASK-26 is the hard prerequisite): trigger -> isolated checkout of the praxisflux repo -> agent implements per the spec -> gates (npx @praxisflux/gates: spec-bridge AND wiki-freshness — the agent must survive this repo's own doc gates) -> human approval -> branch pushed and PR opened (NOT direct merge — praxisflux keeps its PR flow; the approval gates the PR creation, CI + merge stay as-is). Retrospective recorded: what broke, what the checklist missed, cost. User priority: ASAP after isolation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A real praxisflux feature is specced (spec.md/plan.md/tasks.md) and linked to a board task in this repo
- [x] #2 The pipeline runs it in an isolated checkout: agent implements, this repo's own gates (spec-bridge + wiki-freshness) pass, human approves
- [x] #3 The run lands as a praxisflux PR through the normal CI/merge flow with the per-task course and wiki cadence intact
- [x] #4 Retrospective note recorded (what broke, checklist gaps, cost) feeding the presentation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Phase A (this session, normal PR flow): 1. spec TASK-27's reconcile endpoint as specs/001-reconcile-endpoint/ (spec.md/plan.md/tasks.md) in THIS repo; 2. link TASK-27 to it via the spec-bridge link skill (board becomes the derived view); 3. runner /finish gains land:'pr' mode (push pilot branch + gh pr create instead of merging — praxisflux keeps its PR flow; approval gates PR creation); workflow Finish node passes land/prTitle through; test-isolation still green; 4. PR, user merges.
Phase B (the event): trigger the pipeline at target=praxisflux with the implement prompt; agent works in an isolated worktree under this repo's own hooks/gates; spec-bridge gate (npx @praxisflux/gates) rules; human approves -> runner opens the PR; CI runs the full praxisflux gate suite on it; I finalize TASK-27 ceremony (course, wiki cadence if any) on the PR branch before user merges. Retrospective recorded on TASK-30.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Phase B retrospective (run-mrh660hx-adnns, PR #44 merged): the pipeline implemented TASK-27 in an isolated worktree of this repo, under this repo's own hooks and gates, landing as a normal PR after human approval. Six findings: (1) the 10-min agent timeout is wrong for implementation rounds — killed the agent TWICE (exit 143), yet nothing was lost because the continuation prompt demanded commit-per-slice: cheap deaths are a design property; (2) the agent found and root-cause-fixed a REAL bug nobody knew existed — .githooks pre-commit leaked GIT_DIR/GIT_WORK_TREE into test fixture repos when run from a worktree (collateral core.bare flip on the host repo repaired by the human tier); (3) gate-passed != work-complete — the first timeout left an honest-but-incomplete state that PASSED the gate and parked for approval; the human window caught it, but orchestrators should not rely on that for detection; (4) the runner is single-threaded (spawnSync blocks the event loop — /gate cannot answer during an agent round); (5) the agent obeyed the worktree's CLAUDE.md unprompted: full wiki cadence, commit trailer discipline, house comment voice — planted conventions govern whoever works in the repo; (6) direct runner driving (POST /agent with a continuation prompt) is a legitimate human-tier repair path that the parked workflow tolerates gracefully. Cost: 2x ~10min agent rounds (receipts lost to the kills), ~$4-5 estimated. Follow-up candidates (need approval, not created): per-request agent timeout; async runner; a completeness signal distinct from the gate (e.g. plan-of-record check that all spec boxes are checked before parking).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Self-hosting proven: praxisflux developed a real praxisflux feature (TASK-27, the reconcile endpoint) through its own pipeline — spec on its own board via spec-bridge, implementation by the pipeline's agent in an isolated worktree governed by this repo's own hooks/gates/CLAUDE.md, human approval gating PR creation (never a merge), landing as PR #44 through the normal CI/review flow with the per-task course and wiki cadence intact (the agent ran the wiki cadence itself, unprompted). The run survived two 10-minute timeout kills via commit-per-slice discipline and root-cause-fixed a real pre-commit GIT_DIR leak it discovered in the process. Retrospective with six findings and three follow-up candidates recorded in notes — feeding TASK-25 (the presentation) directly.
<!-- SECTION:FINAL_SUMMARY:END -->
