---
name: pdlc-sweep-history-recent
description: Newer half of pdlc-sweep-history's release-by-release doctrine record, split summary-style off the parent at the 8,000-char cap. Covers 0.43.0 onward — cost levers, Spec-Kit degradation hardening, doctrine-seam reconciliation — the field cases that forced each. Receives every future sweep-doctrine release. Earlier releases live in pdlc-sweep-history-early; current doctrine is pdlc-sweep.
kind: note
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: 608ccda
---

# pdlc:sweep — doctrine history (0.43.0–)

Newer half of [[pdlc-sweep-history]]'s release-by-release record, split summary-style
when the parent neared the 8,000-char body cap. Covers 0.43.0 onward — cost levers
through doctrine-seam reconciliation — and is the child that receives every future
sweep-doctrine release. The earlier releases (0.12.1 through 0.42.0) live in
[[pdlc-sweep-history-early]]; [[pdlc-sweep]] states current doctrine.

## Release by release

Since 0.43.0 (skill 0.12.0) three cost levers (TASK-88): every dispatch prompt
carries a **turn-hygiene block** — batch independent reads/checks as parallel tool
calls in one message, minimal between-call narration, mechanical phases at lower
reasoning effort (fewer, more consolidated calls); micro-turns re-pay the full
context read per call (field case: expensive implementers averaged ~300 output
tokens/request). The execution log gains a **tokens/cost (best-effort)** column —
actuals from the harness/transcript, so future runbooks budget against real
numbers. The orchestrator SHOULD **end its session at lane boundaries**,
resuming from runbook + board — a cost prescription, not just crash-resilience:
orchestrator context grows monotonically (field case: 172k→548k, the last fifth
costing as much as the first two-fifths).

Since 0.44.0 (skill 0.13.0) the Spec Kit step cannot **degrade silently** (TASK-84;
field case: two of a twelve-task sweep shipped a claim-stub spec.md only — no plan.md,
tasks.md, or link — yet passed every gate). Four fixes: the **claim commit carries the
spec-bridge link** (marker against the stub — the bridge's Stop gate armed from the
first commit, not after the spec cycle it protects, where skipping disarmed it); step 3
names **`spec.md`/`plan.md`/`tasks.md`**, each real and committed before implementation
(absent-constitution → plan against the grounding docs, not ceremony); step 4 is **link
completion** (phase ACs seeded from tasks.md, marker verified); the template gains a
**"Per-task artifacts required before PR"** section; and the **Output gate** requires
each `specs/NNN-*/` to hold spec+plan+tasks **or** an operator-signed escape line
naming the task and stand-in — never a second mechanism. Companion: Lane-0 rulings
changing the per-task loop land as checkable runbook gate lines, not prose.

Since 0.47.0 (skill 0.14.0) seven 035-038 stack seams reconcile (TASK-89): the
**execution-log cadence** agrees (step 5 in-flight row per dispatch boundary, step 10
closing row at merge); the skip-path drops "non-trivial" (only sanctioned skip = the
escape line); the **Output gate** re-checks each scoped card's Spec marker at sweep end
(template matched); the runbook gains a **fallback model ID** slot for
subscription-unavailability plus which model served (operator ruling 2026-07-31); the
template's escape-line section carries the **never-a-second-mechanism** clause; and two
redundancies trim to one home each (context-read rationale, tier-note).

## Connections

- Parent note: [[pdlc-sweep-history]] — the entry point; current doctrine is
  [[pdlc-sweep]].
- Sibling: [[pdlc-sweep-history-early]] — 0.12.1 through 0.42.0.
