---
id: TASK-20
title: >-
  Headless skill-runner spike: prove one skill runs to completion
  non-interactively
status: To Do
assignee: []
created_date: '2026-07-11 01:29'
labels: []
dependencies: []
priority: high
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
decision-1's extraction step 2 and the last real unknown in the orchestration story (step 1, npm gates, shipped as TASK-17). Prove that one agent-tier skill runs headlessly: input files in -> claude -p (or Agent SDK) drives the skill in a scratch project -> output files + meaningful exit out, no human in the chat. Candidate skill: spec-bridge sync (now nearly deterministic around the plan command, smallest creative surface) or grounding-wiki wiki-update on a small fixture repo. Capture: the exact invocation (flags, permission mode, plugin loading headlessly), how skill gates behave without a Stop-hook session, wall-clock/token cost, and every point where the skill implicitly assumed an interactive user — those become the headless-readiness checklist for other skills. Findings feed the n8n pilot task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A documented, reproducible headless invocation runs the chosen skill end-to-end in a fixture project with exit code reflecting success/failure
- [ ] #2 The run produces the skill's normal artifacts and passes the relevant gate afterwards, verified by the gate CLI not by transcript reading
- [ ] #3 Every interactive assumption encountered is recorded as a headless-readiness checklist in docs/ (or the task) with proposed fixes
- [ ] #4 Findings recorded on the task; follow-up scope (if any) proposed, not silently expanded
<!-- AC:END -->
