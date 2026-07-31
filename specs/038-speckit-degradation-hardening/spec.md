# 038 — the Spec Kit step must not degrade silently

**Board:** TASK-84 · **Runbook:** docs/design/speckit-degradation-runbook.md (Lane 1)

## Problem

Observed live during a pdlc:sweep of infinitynode.media (2026-07-28, 12 debt tasks):
the operator explicitly chose the full per-task Spec Kit cycle at the precondition
gate, yet two tasks shipped with a claim-stub spec.md only — no plan.md, no
tasks.md, no spec-bridge:link — and were moved to Done by the backlog CLI directly.
Nothing in the sweep detected this at any point, including its own Output gate.
Four upstream causes (full diagnosis on the card): (1) specification-detail
asymmetry — the claim step gets ~21 mechanical lines, the whole Spec Kit cycle one
sentence, and in a procedural skill detail reads as obligation; (2) the enforcing
gate is armed too late — spec-bridge:link is step 4, after the spec cycle it
protects, so skipping step 3 disarms the gate that exists to catch the skip;
(3) the runbook template has no slot for per-task artifact obligations, so they
cannot survive a context boundary; (4) the Output gate cannot see the omission —
a sweep passes it with zero plan.md/tasks.md in the repo. Plus (5): operator
rulings recorded as narrative prose have no mechanical consequence.

This is the INVERSE of TASK-79 (which will widen what is *permitted* when
`.specify/` is absent); this task narrows what goes *unnoticed*. The two must
compose, not contradict (operator-blessed wording below).

## Requirements

- **R1 (AC #1)** — SKILL.md step 3 states the required artifacts BY NAME —
  `spec.md`, `plan.md`, `tasks.md` — with the same mechanical, checkable
  specificity the claim step has (what each must contain to count as real, not a
  stub; committed on the claimed branch), including what to do when the host
  constitution is absent or unratified (state that plainly in plan.md and proceed
  against the project's grounding docs instead — never treat the plan step as
  ceremony).
- **R2 (AC #2)** — `spec-bridge:link` moves from step 4 into the claim commit in
  step 2: the claim plants the Spec marker on the card (a stub spec dir suffices —
  the bridge derives "planning" from it), so the bridge's Stop gate is armed from
  the branch's FIRST commit. Step 4 keeps its number but becomes the link's
  completion: seed/refresh phase ACs from tasks.md (link update mode) once the
  spec cycle has produced it, and verify the marker survived. (Keep step numbering
  stable — step 5/step 10 are referenced by wiki notes and prior runbooks.)
- **R3 (AC #3)** — `templates/runbook.md` gains a **"Per-task artifacts required
  before PR"** section: no PR opens for a task until `specs/NNN-*/` carries real
  `spec.md` + `plan.md` + `tasks.md` and the spec is linked to the card — plus a
  slot for host-specific additions.
- **R4 (AC #4)** — the sweep Output gate adds (operator-blessed wording,
  2026-07-31): every scoped task's `specs/NNN-*/` contains spec+plan+tasks **or**
  the runbook records an operator-signed escape line naming the task and what
  stands in for the artifacts. Worded so TASK-79's future hand-authored-specs
  hatch is one INSTANCE of the recorded escape line, not a competing mechanism.
- **R5 (AC #5)** — doctrine sentence: a precondition/Lane-0 decision that changes
  the per-task loop must be written as a checkable line in the runbook's gate
  section, not only as prose (Phase 1's gate-enumeration item and/or the
  checkpoint doctrine — one canonical placement).
- **R6 (AC #6)** — TASK-79 and TASK-84 cross-referenced on both cards (append
  notes; TASK-79 stays To Do, otherwise untouched), with a recorded verification
  that the shipped R4 wording and 79's planned hatch are non-contradictory.
- **R7 (AC #7)** — sweep skill `version:` 0.12.0 → 0.13.0; marketplace 0.43.0 →
  0.44.0; `docs/wiki/pdlc-sweep.md` re-verified against the diff — its body is at
  7,999/8,000, so expect a **summary-style split** per docs/corpus-spec.md; gates
  green.

## Non-goals

- TASK-79's escape hatch itself (precondition-gate widening) — NOT implemented
  here; only the composition surface for it.
- No changes to spec-bridge (plugin) — the link skill already supports marker-only
  linking and update-mode AC seeding; this is sweep doctrine text only.
- No new scripts or machinery.
