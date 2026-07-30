# 037 — implementer turn-hygiene block + per-task cost accounting in the runbook

**Board:** TASK-88 · **Runbook:** docs/design/sweep-cost-levers-runbook.md (Lane 3, tail)

## Problem

Same analysis as specs 035/036 (sweep-dat-board, session b129d47c, $1,192.57):
expensive implementers averaged ~300 output tokens per request — micro-turns, one
tool call each, every one re-paying the full context read. Two prompt-level levers
belong in the sweep's dispatch doctrine: (1) require batched/parallel tool calls
where independent; (2) run mechanical phases at lower effort, which produces
fewer, more consolidated tool calls. The runbook should also record per-task
token/cost actuals so future runbook authoring budgets against real numbers. And
the orchestrator side has the same disease: the field session's main context grew
172k→548k — the last fifth cost as much as the first two-fifths — so ending the
orchestrator session at lane boundaries and resuming from the runbook + board is a
cost prescription, not just crash-resilience.

## Requirements

- **R1** — SKILL.md dispatch guidance (step 5) includes a **turn-hygiene block**
  that every implementer dispatch prompt must carry: batch independent
  reads/checks as parallel tool calls in a single message; minimal between-call
  narration; run mechanical phases at lower reasoning effort (fewer, more
  consolidated tool calls), with the rationale stated (micro-turns re-pay the
  full context read per call; field case ~300 output tokens per request).
- **R2** — `templates/runbook.md` execution log gains a **tokens/cost column**
  (best-effort actuals per task, from the harness or transcript), so future
  runbook authoring can budget against real numbers.
- **R3** — SKILL.md states the **orchestrator SHOULD end its session at lane
  boundaries** and resume from the runbook + board — framing the existing
  session-portability design as a cost prescription (orchestrator context grows
  monotonically; the runbook is the contract that makes fresh resumption safe).
- **R4** — Marketplace version and the sweep skill's own `version:` bumped per
  `docs/releasing.md` (minor: behavior-visible doctrine change).

## Non-goals

- No new machinery, no scripts, no harness integration for cost capture —
  "best-effort actuals" is a recording convention, not tooling.
- No change to the phase-scoped dispatch or model-ID doctrine (specs 035/036);
  this composes with them.
