---
id: TASK-88
title: >-
  pdlc:sweep — implementer turn-hygiene block + per-task cost accounting in the
  runbook
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-30 18:32'
updated_date: '2026-07-30 19:50'
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

Spec: specs/037-sweep-turn-hygiene-cost-accounting
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md dispatch guidance includes a turn-hygiene block for implementer prompts: batched parallel tool calls, minimal between-call narration, lower effort on mechanical phases
- [x] #2 templates/runbook.md execution log gains a tokens/cost column (best-effort actuals per task)
- [x] #3 SKILL.md states the orchestrator should end its session at lane boundaries and resume from the runbook + board (session-portability rule already exists; this makes it a cost prescription, not just crash-resilience)
- [x] #4 Marketplace version and sweep skill version bumped per docs/releasing.md
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Doctrine edits per specs/037-sweep-turn-hygiene-cost-accounting/plan.md (SKILL.md turn-hygiene block + session-boundary prescription; template tokens/cost column)
2. Version bumps: sweep skill 0.12.0, marketplace 0.43.0 via sync-version.mjs
3. Wiki: pdlc-sweep NEEDS-REVIEW within tight budgets (split if needed); siblings RE-PIN-ONLY; CAPSULES if description changes
4. Gates; PR; merge; spec-bridge:sync
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dispatch record (runbook Lane 3): tier=default implementer, model=claude-opus-5 (Agent param opus), pinned explicitly per runbook — doctrine prose, no code. Orchestrator: sweep session e38ecfe5.
<!-- SECTION:NOTES:END -->
