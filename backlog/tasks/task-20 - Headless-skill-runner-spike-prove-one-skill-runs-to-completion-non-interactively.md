---
id: TASK-20
title: >-
  Headless skill-runner spike: prove one skill runs to completion
  non-interactively
status: Done
assignee:
  - '@claude'
created_date: '2026-07-11 01:29'
updated_date: '2026-07-11 02:23'
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
- [x] #1 A documented, reproducible headless invocation runs the chosen skill end-to-end in a fixture project with exit code reflecting success/failure
- [x] #2 The run produces the skill's normal artifacts and passes the relevant gate afterwards, verified by the gate CLI not by transcript reading
- [x] #3 Every interactive assumption encountered is recorded as a headless-readiness checklist in docs/ (or the task) with proposed fixes
- [x] #4 Findings recorded on the task; follow-up scope (if any) proposed, not silently expanded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Fixture: scratch project (git + backlog init + linked task + Spec Kit-shaped spec dir) via the TASK-9.7 verification recipe, in a tmp dir.
2. Headless attempt: claude -p '/spec-bridge:sync' from the fixture root, least-privilege first (--allowedTools scoped to Bash(node/backlog) + reads), --output-format json for cost/duration; escalate flags only as observed failures demand and record each escalation as a checklist item.
3. Verify by artifacts only: spec-bridge cli plan (must be empty) + check (exit 0, no lag warnings) after the run; never by reading the transcript.
4. Exercise one corrective loop: re-stale the fixture (regenerate tasks.md), rerun headlessly, re-verify — the n8n gate-node pattern.
5. Deliverable: docs/headless-runner.md — the exact invocation, observed behavior (incl. Stop-hook/gate behavior in -p mode), cost/wall-clock, and the headless-readiness checklist of interactive assumptions found.
6. Findings to task notes; propose follow-ups, never silently expand.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Three headless runs of /spec-bridge:sync via claude -p (CLI 2.1.207) against a fixture Backlog+SpecKit project, each verified by artifacts only (plan empty + check clean + spec-dir git status): (1) lag -> In Progress + mirror, 8 turns/49s/$0.71; (2) regeneration + all checked -> Done with derived final summary, 6/43s/$0.67; (3) new phase after Done -> honest backwards move, 10/45s/$0.75. Key findings: exit 0 means session-completed not task-succeeded (verify by gates, never exit codes); --allowedTools is ADDITIVE to inherited user config, not a sandbox — least privilege needs environment isolation (container/clean config); plugins were inherited from the dev machine's marketplace install — orchestrator images must install them explicitly; the skill's SKILL.md output-gate shape self-verified unattended; the plan command kept runs cheap/low-variance. Deliverable: docs/headless-runner.md (recipe, observed behavior, 6-point headless-readiness checklist, not-exercised follow-ups: blocking-Stop behavior in -p, container recipe -> TASK-22 input). Total spike cost ~$2.13.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Proven: a praxisflux skill runs to completion non-interactively. claude -p '/spec-bridge:sync' with scoped allowedTools completed three scenarios (lag, regeneration->Done, honest backwards move) in a fixture project, each judged by artifacts through the gate CLI (plan empty, check clean, zero spec-dir writes) — never by transcript. Recipe, observed behavior (exit codes are session-level; --allowedTools is additive not a sandbox; plugins inherited from machine install; output-gate-shaped skills self-verify), and a 6-point headless-readiness checklist are documented in docs/headless-runner.md and linked from README. Follow-ups proposed, not expanded: blocking-Stop behavior in -p mode, and the clean-config container recipe (feeds TASK-22). ~$2.13 total spike cost.
<!-- SECTION:FINAL_SUMMARY:END -->
