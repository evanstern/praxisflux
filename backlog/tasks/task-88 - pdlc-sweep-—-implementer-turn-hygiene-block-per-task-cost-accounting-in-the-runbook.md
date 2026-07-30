---
id: TASK-88
title: >-
  pdlc:sweep — implementer turn-hygiene block + per-task cost accounting in the
  runbook
status: To Do
assignee: []
created_date: '2026-07-30 18:32'
labels:
  - sweep-cost
  - pdlc-sweep
dependencies:
  - TASK-86
priority: medium
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Same analysis (session b129d47c): expensive implementers averaged ~300 output tokens per request — micro-turns, one tool call each, every one re-paying the full context read. Two prompt-level levers belong in the sweep's dispatch template: (1) require batched/parallel tool calls where independent ('send independent reads/checks in a single message'); (2) run mechanical phases at lower effort, which produces fewer, more consolidated tool calls. Additionally the runbook execution log should record per-task token/cost actuals (from the harness or transcript) so future runbook authoring can budget against real numbers. Orchestrator-side doctrine addition: the orchestrator SHOULD end its session at lane boundaries and resume from the runbook (main-session context grew 172k→548k; the last fifth cost as much as the first two-fifths).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SKILL.md dispatch guidance includes a turn-hygiene block for implementer prompts: batched parallel tool calls, minimal between-call narration, lower effort on mechanical phases
- [ ] #2 templates/runbook.md execution log gains a tokens/cost column (best-effort actuals per task)
- [ ] #3 SKILL.md states the orchestrator should end its session at lane boundaries and resume from the runbook + board (session-portability rule already exists; this makes it a cost prescription, not just crash-resilience)
- [ ] #4 Marketplace version and sweep skill version bumped per docs/releasing.md
<!-- AC:END -->
