# 043-sweep-background-job-mode — plan

**Constitution:** none ratified — planning against the grounding docs
(docs/principles.md, docs/wiki/pdlc-sweep.md, the three background-job runbooks cited
in spec.md) per sweep doctrine's absent-constitution rule.

## Approach

One file substantively (`pdlc/skills/sweep/SKILL.md`, now 0.14.0 after TASK-89), plus a
minimal template touch only if naming the mode requires a slot.

1. **R1 — mode section:** add a compact named subsection (suggested: under the
   Concurrency doctrine, near "Paused lanes", titled e.g. "Background-job / no-main-push
   execution mode") stating the trigger (orchestrator cannot push the default branch)
   and the three substitutes: harness-isolation worktrees (`.claude/worktrees/task-N`,
   entered via the harness's worktree switch), closures-ride-next-branch, wrap-up PR
   for sweep-close. Cite the field provenance (three 2026-07-30/31 runbooks) in one
   clause, not a history essay — [[pdlc-sweep-history]] owns history.
2. **R2 — step clauses:** step 2 (worktree location), step 9 (root-first ticks + sync),
   step 10 (board/spec commands from root; log cadence) each gain a short "in the
   background-job mode, see the mode section" qualifier rather than restating the
   substitutes three times. Keep hunks minimal — TASK-79 edits this file next.
3. **R3 — TASK-85 reconcile:** inside the mode section, one sentence: the two-track
   landing rule (board commits direct to main; deliverables by PR — TASK-85's planting)
   degrades in this mode to board-track edits riding the next branch / wrap-up PR.
   Then `backlog task edit TASK-85 --append-notes` cross-referencing this mode (and a
   matching note on TASK-90's card) so the wording stays reconciled when 85 implements.
4. **R4 — release:** sweep skill 0.14.0 → 0.15.0; `node scripts/sync-version.mjs <next
   free minor vs origin/main>` at merge-readiness (expect 0.48.0 or next free — TASK-80
   is merging concurrently; on a pre-push tag rejection, re-sync to the next free and
   re-pin, as siblings did). Re-verify `docs/wiki/pdlc-sweep.md` (NEEDS-REVIEW; body
   6,308/8,000 after TASK-89 — a one-line mode mention fits; overflow history to
   pdlc-sweep-history if needed). Lockstep stamps → classify siblings (expect
   RE-PIN-ONLY).
5. **Gates:** node --test, check-docs, freshness, version-bump — green in worktree;
   re-run after any history move.

## Risks

- TASK-79 follows on this same file — keep the mode section self-contained.
- pdlc-sweep-history sits at 7,992/8,000 — if the mode warrants a history line, trim
  within budget or skip (the mode section itself carries provenance).
