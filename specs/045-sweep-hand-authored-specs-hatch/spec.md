# 045-sweep-hand-authored-specs-hatch — spec

**Board task:** TASK-79 · **Finding source:** refactor-triage run praxis-2026-07-27-16-07-29
(group F; report §improved 9 + the process half of 6); triage record
docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md.

## Problem

Two "precedent pretending to be exception" seams in sweep doctrine:

1. The precondition gate says missing `.specify/` → stop, yet many sweeps (board-clearing
   → downstream-bugfix → sweep-followups → … → the current board-cost-test run) have
   overridden it by recorded host precedent: hand-authored
   `specs/NNN/{spec,plan,tasks}.md` is de facto sanctioned doctrine.
2. specs/033's plan.md softened a signed-off runbook gate ("only if check-docs demands")
   with no runbook amendment, though runbook deviations are defined as operator
   checkpoints.

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1) — the escape hatch, as an escape-line instance:** the precondition gate
  states that absent `.specify/` is acceptable when the host has an established
  hand-authored-specs precedent, **recorded in the runbook** — and per the card's
  2026-07-31 cross-reference note, this recording is implemented as exactly **one
  instance of the existing operator-signed escape line** in the runbook's "Per-task
  artifacts required before PR" section (TASK-84's R4 wording already reads a recorded
  sanction as such a line) — never as a second mechanism. The gate text points at that
  section; the Output gate's existing spec+plan+tasks-or-escape-line clause is the
  enforcement, unchanged.
- **R2 (AC #2) — gate-softening is a runbook amendment:** the concurrency/checkpoint
  doctrine states: plan-time (or implement-time) softening of any signed-off runbook
  gate is a **runbook amendment plus operator ping**, never an implementer decision
  note in a spec artifact.
- **R3 (AC #3) — release mechanics:** sweep skill `version:` 0.15.0 → 0.16.0 +
  marketplace lockstep bump; `docs/wiki/pdlc-sweep.md` re-verified against the diff and
  re-pinned; gates green.

## Non-goals

- No change to the escape-line wording TASK-84 shipped or the mode section TASK-90 just
  added — R1 composes with both.
- No template restructuring — the template's escape-line slot already exists; at most a
  parenthetical noting host-precedent sanction as an instance.

## Done means

All three ACs checked on TASK-79; a host without `.specify/` but with recorded
precedent passes the precondition gate through the escape-line mechanism (one
mechanism, not two); gate-softening doctrine states the amendment rule; PR merged with
bumps and a re-verified wiki note.
