---
id: TASK-30
title: 'Self-hosting: a praxisflux task developed through praxisflux''s own pipeline'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-12 01:24'
updated_date: '2026-07-12 02:11'
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
- [ ] #1 A real praxisflux feature is specced (spec.md/plan.md/tasks.md) and linked to a board task in this repo
- [ ] #2 The pipeline runs it in an isolated checkout: agent implements, this repo's own gates (spec-bridge + wiki-freshness) pass, human approves
- [ ] #3 The run lands as a praxisflux PR through the normal CI/merge flow with the per-task course and wiki cadence intact
- [ ] #4 Retrospective note recorded (what broke, checklist gaps, cost) feeding the presentation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Phase A (this session, normal PR flow): 1. spec TASK-27's reconcile endpoint as specs/001-reconcile-endpoint/ (spec.md/plan.md/tasks.md) in THIS repo; 2. link TASK-27 to it via the spec-bridge link skill (board becomes the derived view); 3. runner /finish gains land:'pr' mode (push pilot branch + gh pr create instead of merging — praxisflux keeps its PR flow; approval gates PR creation); workflow Finish node passes land/prTitle through; test-isolation still green; 4. PR, user merges.
Phase B (the event): trigger the pipeline at target=praxisflux with the implement prompt; agent works in an isolated worktree under this repo's own hooks/gates; spec-bridge gate (npx @praxisflux/gates) rules; human approves -> runner opens the PR; CI runs the full praxisflux gate suite on it; I finalize TASK-27 ceremony (course, wiki cadence if any) on the PR branch before user merges. Retrospective recorded on TASK-30.
<!-- SECTION:PLAN:END -->
