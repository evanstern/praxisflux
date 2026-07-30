# 035 — sweep dispatch pins an explicit model ID per tier

**Board:** TASK-86 · **Runbook:** docs/design/sweep-cost-levers-runbook.md (Lane 1)

## Problem

pdlc:sweep's runbook records a model *tier* per task ("default implementer", "Opus
tier"), but dispatch never resolves the tier to a concrete model: the implementer
subagent inherits the orchestrator session's model. Cost analysis of the
sweep-dat-board run (promptworld session b129d47c, 2026-07-29→30, $1,192.57 total)
showed implementers dispatched as "Opus tier" ran on claude-fable-5 ($10/$50 per
MTok) because the orchestrator was a Fable session — $967 of $1,192 (81%) — where
Opus 5 ($5/$25) was the stated tier intent at half the unit price. Estimated
~$450–480 saved on a comparable sweep with zero behavior change.

## Requirements

- **R1** — SKILL.md Phase 1 item 2 (model tier per task) requires the runbook to
  record an **explicit model ID** next to each tier label (e.g. `claude-opus-5`),
  chosen from the host rubric; a bare tier name is not a valid runbook entry.
- **R2** — SKILL.md step 5 (dispatch) instructs the orchestrator to **pass that
  model ID explicitly** to the implementer agent (e.g. the Agent tool's `model`
  param), never relying on session-model inheritance; the rationale (tier names
  silently resolve to the session model, which may sit a price tier above the
  intent) is stated where the instruction lives.
- **R3** — `templates/runbook.md` gains a slot for tier AND model ID per task in
  the lane entries, so runbook authors cannot omit it.
- **R4** — Marketplace version and the sweep skill's own `version:` bumped per
  `docs/releasing.md` (minor: behavior-visible doctrine change).

## Non-goals

- No new machinery — doctrine text only.
- No change to *which* tiers a host rubric defines (that stays host judgment);
  only the tier→model-ID resolution becomes mechanical.
- TASK-87 (phase-scoped dispatch) and TASK-88 (turn hygiene, cost accounting)
  land separately on top of this.
