---
id: TASK-87
title: >-
  pdlc:sweep — phase-scoped implementer dispatch: one agent per tasks.md phase,
  fresh context each
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-30 18:32'
updated_date: '2026-07-30 19:34'
labels:
  - sweep-cost
  - pdlc-sweep
dependencies:
  - TASK-86
priority: medium
ordinal: 122000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The sweep-dat-board cost analysis (session b129d47c, $1,192.57) showed the dominant cost mechanism is long-lived implementer subagents accumulating huge contexts: the TASK-80 implementer alone cost $404 over 699 requests at ~427k avg context — a ~$0.45 context-re-read tax on every tool call, and the accumulation is the agent's own transcript (baseline is only ~32k). Spec Kit's tasks.md is already a phase list; the sweep should dispatch one implementer per phase (or per small group of phases), each starting fresh from the spec + the branch's commits (~35k context) instead of one agent living to 500k+. Handoff artifacts (spec, plan, tasks.md tick-state, commits on the branch) already exist — this is doctrine text in sweep SKILL.md step 5, not new machinery. Estimated ~3x reduction in average implementer context, saving $300-450 on a comparable sweep.

Spec: specs/036-sweep-phase-scoped-dispatch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md step 5 prescribes phase-scoped dispatch: a fresh implementer agent per tasks.md phase (or explicitly-grouped phases), re-grounded from spec artifacts + branch commits, with the rationale (context re-read cost) stated
- [x] #2 Doctrine states what the phase handoff artifact set is (spec dir, tasks.md tick-state, branch commits) and that nothing may be handed off via chat context
- [x] #3 templates/runbook.md execution-log or per-task section accommodates multi-phase dispatch (phases dispatched/completed visible)
- [x] #4 Marketplace version and sweep skill version bumped per docs/releasing.md
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Doctrine edits per specs/036-sweep-phase-scoped-dispatch/plan.md (SKILL.md step 5 phase-scoped dispatch + handoff artifact set; templates/runbook.md phase visibility)
2. Version bumps: sweep skill 0.11.0, marketplace 0.42.0 via sync-version.mjs
3. Wiki: pdlc-sweep NEEDS-REVIEW within budgets; lockstep siblings RE-PIN-ONLY; CAPSULES if description changes
4. Gates; PR; merge; spec-bridge:sync
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dispatch record (runbook Lane 2): tier=default implementer, model=claude-opus-5 (Agent param opus), pinned explicitly per runbook — doctrine prose, no code. Orchestrator: sweep session e38ecfe5.
<!-- SECTION:NOTES:END -->
