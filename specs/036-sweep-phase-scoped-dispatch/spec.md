# 036 — phase-scoped implementer dispatch: one agent per tasks.md phase, fresh context each

**Board:** TASK-87 · **Runbook:** docs/design/sweep-cost-levers-runbook.md (Lane 2)

## Problem

The sweep-dat-board cost analysis (promptworld session b129d47c, $1,192.57) showed
the dominant cost mechanism is long-lived implementer subagents accumulating huge
contexts: the TASK-80 implementer alone cost $404 over 699 requests at ~427k
average context — a ~$0.45 context-re-read tax on every tool call — and the
accumulation is the agent's own transcript (the dispatch baseline is only ~32k).
Spec Kit's tasks.md is already a phase list; the sweep should dispatch one
implementer per phase (or per explicitly-grouped small phases), each starting
fresh from the spec + the branch's commits (~35k context) instead of one agent
living to 500k+. The handoff artifacts already exist — this is doctrine text in
sweep SKILL.md step 5, not new machinery. Estimated ~3x reduction in average
implementer context, saving $300–450 on a comparable sweep.

## Requirements

- **R1** — SKILL.md step 5 prescribes **phase-scoped dispatch**: a fresh
  implementer agent per tasks.md phase (or explicitly-grouped phases), each
  re-grounded from the spec artifacts + the branch's commits, with the rationale
  stated where the instruction lives (every tool call re-pays the full context
  read; a long-lived implementer's context is mostly its own transcript).
- **R2** — the doctrine names the **phase handoff artifact set** — the spec dir
  (spec.md, plan.md, tasks.md), the tasks.md tick-state, and the branch's
  commits — and states that nothing may be handed between phases via chat
  context: if the next phase needs it, it lives in an artifact.
- **R3** — `templates/runbook.md` accommodates multi-phase dispatch: the
  execution log (or the per-task lane entry) makes phases dispatched/completed
  visible, so a resuming session can see where within a task the last one
  stopped.
- **R4** — Marketplace version and the sweep skill's own `version:` bumped per
  `docs/releasing.md` (minor: behavior-visible doctrine change).

## Non-goals

- No new machinery, no scripts — doctrine text only.
- Grouping judgment stays with the runbook author/orchestrator (tiny adjacent
  phases MAY be explicitly grouped into one dispatch; the default is one per
  phase).
- Turn hygiene inside a dispatch and cost accounting in the log are TASK-88
  (next lane), not this spec.
