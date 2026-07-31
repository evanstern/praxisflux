# 043-sweep-background-job-mode — spec

**Board task:** TASK-90 · **Finding source:** refactor-triage run praxis-2026-07-31-11-12-22
(lead intent-drift pass, finding 5); evaluation report
docs/reviews/team-review-sweep-close-84-2026-07-31-15-12-53.md; triage record
docs/reviews/refactor-triage-praxis-2026-07-31-11-12-22.md. Accepted by operator
2026-07-31 (two occurrences suffice; same 'precedent pretending to be exception' shape
as TASK-79).

## Problem

Three sweeps (2026-07-30/31, and the currently-executing board-cost-test sweep) have run
as Claude Code background jobs and systematically deviated from doctrine written for an
interactive session with main-push rights:

- Task worktrees live at `.claude/worktrees/task-N` under harness isolation, not
  `.worktrees/task-N` as SKILL.md step 2 prescribes.
- Post-merge tasks.md ticks + `spec-bridge:sync` ride the NEXT task's branch instead of
  being committed at root (step 9).
- Board/spec commands run inside the task worktree, not at root (step 10).
- Sweep-close (final closures + runbook status flip) lands via a small wrap-up PR,
  because background jobs never push main.

The pattern is recorded only in runbooks (`docs/design/sweep-cost-levers-runbook.md`,
`docs/design/speckit-degradation-runbook.md`, `docs/design/board-cost-test-runbook.md`)
— precedent pretending to be an exception. The card's decision: doctrine it as a
**named execution mode** in sweep SKILL.md.

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1) — the named mode:** sweep SKILL.md names the background-job / no-main-push
  execution mode: when the orchestrator runs where pushing the default branch directly is
  unavailable or forbidden (background jobs, protected-main hosts), the substitute steps
  are (a) task worktrees under the harness's isolation root (`.claude/worktrees/task-N`,
  entered via the harness's worktree switch) instead of `.worktrees/`; (b) post-merge
  closures (tasks.md tick + sync-derived board Done + runbook log rows) ride the NEXT
  claimed task's branch; (c) the final sweep-close (last closures, runbook status flip)
  lands via a small wrap-up PR.
- **R2 (AC #2) — steps acknowledge the mode:** steps 2, 9, and 10 gain a clause (or a
  pointer to the mode section) so they no longer contradict it — the interactive-root
  wording stays the default; the mode names the substitutes.
- **R3 (AC #3) — TASK-85 reconciled, not implemented:** the mode's wording composes with
  the two-track landing rule TASK-85 will plant (board/bookkeeping commits direct to
  main, deliverables by PR): in this mode the board track's "direct to main" degrades to
  "rides the next branch / wrap-up PR". Cross-reference TASK-85 on both cards; do NOT
  implement 85's template/bootstrap changes here.
- **R4 (AC #4) — release mechanics:** sweep skill `version:` 0.14.0 → 0.15.0 +
  marketplace lockstep bump; `docs/wiki/pdlc-sweep.md` re-verified against the diff and
  re-pinned; gates green.

## Non-goals

- TASK-85 (bootstrap plants the two-track rule) — wording reconcile only.
- TASK-79 (hand-authored-specs hatch) — next in this lane; untouched.
- No template (runbook.md) restructuring beyond what naming the mode requires — the
  template already carries a background-job doctrine line in live runbooks; if a slot is
  added, keep it minimal.

## Done means

All four ACs checked on TASK-90; a fresh background-job session can follow SKILL.md
alone (no runbook archaeology) to run a sweep without main-push rights; PR merged with
bumps and a re-verified wiki note.
