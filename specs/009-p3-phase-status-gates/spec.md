# 009-p3-phase-status-gates — P3 artifact-gated seams + opt-in phase-level board status

Board: TASK-34 · Sweep: `docs/design/board-clearing-runbook.md` (Lane 2) ·
Direction: Coda upstream request (task description carries the full rationale — the
colleague 9-workflow n8n SDLC design, whose two generalizable ideas land here).

## Problem

Leg 1: the colleague design chains pipeline stages by direct calls that trust the
caller's payload. The praxis-grade restatement of P1 for orchestration seams has no
canonical home. Leg 2: that design's Jira flow makes the board the pipeline's
observability surface; praxis boards collapse everything into "In Progress" and the
spec-bridge gate only knows the 3-status vocabulary. Coda's per-phase board-status task
is blocked on both landing upstream.

## Requirements

### R1 — P3 in docs/principles.md (AC #1)

Following P1/P2's canonical-statement + reference-and-apply structure (and P2's fresh
Provenance-line convention): a pipeline SHOULD be split into single-responsibility
stages, and every stage boundary MUST re-derive its state from durable artifacts (git,
the board, spec dirs, run records) — **the trigger is a doorbell, never a contract; a
payload is an untrusted hint.** State the payoff: stages become independently
re-runnable, replaceable, and orchestrator-agnostic. Provenance: generalized from the
colleague n8n SDLC design during Coda's evaluation (same bet as praxis decision-1 /
Coda constitution Principle IV); consumers reference and add domain application.

### R2 — opt-in phase-level status vocabulary in spec-bridge derivation (AC #2)

- Extend the derivation module (TASK-9.x lineage: `spec-bridge/gates/*` derive board
  status from spec artifacts) so a consumer board MAY opt into a finer vocabulary,
  derived mechanically: `spec.md` exists → past Specifying; `plan.md` → past Planning;
  `tasks.md` phases ticking → Implementing/Validating; all-checked but unmerged →
  review-stage; merged/final-summary path unchanged → Done-eligible.
- **Opt-in mechanism:** extend `.spec-bridge.json` (the existing `loadBridgeConfig` /
  `strictDone` precedent) — e.g. a `statusVocabulary` map from derivation stages to the
  consumer board's status names. Absent config = exactly today's 3-status behavior.
- **Backward compatibility is a hard requirement (runbook checkpoint):** any design
  where a 3-status board changes behavior → STOP and surface to the orchestrator.
  Every existing test must pass unmodified (except additive new ones).

### R3 — the bridge gate enforces at phase granularity (AC #3)

When the finer vocabulary is opted in, `checkBridge`'s status-never-exceeds-artifacts
verdict ranks against the phase-level derivation (a board status mapping to a later
stage than the artifacts prove → block, naming task, spec, and shortfall); lagging
still warns, agreeing stays silent — the existing gate semantics at finer grain.

### R4 — consumer-facing docs (AC #4)

Document the phase-status contract and the opt-in in `docs/consuming-gates.md` and/or
`spec-bridge/README.md` (whichever the existing structure indicates; keep one story).

### R5 — Coda cross-reference (AC #5)

Record on completion (final summary / implementation notes, which the orchestrator
lands): Coda's workflow-split epic (kofile/coda) names this task as its upstream
blocker — the note travels with the task so the dependency is discoverable from here.

### R6 — releasing + grounding

- Released surface: spec-bridge gates/lib + skills touched → bump edited spec-bridge
  skill versions (link/sync SKILL.md only if actually edited) + marketplace
  `scripts/sync-version.mjs 0.18.0` (0.17.0 released; sibling-collision re-bump is the
  orchestrator's).
- `node --test`: new coverage for vocabulary derivation, gate enforcement at phase
  grain, and config-absent behavior; existing tests untouched.
- Wiki re-pins as the freshness gate demands (expect `spec-bridge-plugin`,
  `gates-convention`, plus lockstep stales); v2 budgets hard; CAPSULES.md regen if any
  description changes. No course (per-feature policy).

## Non-goals

Coda's own board wiring (downstream); changing default 3-status derivation; renaming
existing statuses; principles P1/P2 edits.

## Acceptance

Board ACs #1–#5 map to R1–R5; R6 is release/grounding hygiene.
