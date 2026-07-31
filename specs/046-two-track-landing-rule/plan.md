# 046-two-track-landing-rule — plan

**Constitution:** none ratified — planning against docs/principles.md (the
one-TASK-one-PR and reason-to-approve principles R2 derives from),
docs/wiki/pdlc-plugin.md, and the planted-template mechanics in pdlc/scripts/plant.mjs.

## Approach

Template-first, then the two skill touches, smallest hunks possible.

1. **R1+R2 — the planted wording:** in `pdlc/templates/CLAUDE.md`'s backlog block
   (the "One task, one PR" bullet's neighborhood), add a compact two-track bullet:
   board/bookkeeping commits (cards, status flips, notes, AC ticks) land direct on
   the default branch; deliverable work lands by PR — because a PR exists only where
   it carries a stated reason for a human to approve, and a board card carries no
   such decision: the rule is that principle applied, not an exception to
   one-task-one-PR. Where main-push is unavailable (background jobs, protected
   main), the board track degrades to riding the next task branch — one clause, so
   planted hosts and TASK-90's sweep mode stay consistent.
2. **R3 — replant path:** confirm plant.mjs replaces the whole marked block on
   update (TASK-74's re-plant demonstrated it). If bootstrap's SKILL.md update-path
   prose doesn't already say the block refreshes wholesale, add the one sentence;
   otherwise tick R3 on the strength of the existing mechanics and say so in the
   final report.
3. **R4 — sweep reference:** in sweep SKILL.md, at the natural board-hygiene point
   (step 10's board-hygiene sentence or the mode section's two-track sentence),
   add/adjust ONE clause referencing "the planted two-track landing rule
   (pdlc:peer:backlog block)" instead of restating it. TASK-79 is concurrently
   editing this file's precondition/checkpoint sections — do not touch those
   regions.
4. **R5 — release:** bootstrap skill 0.7.0 → 0.8.0; sweep skill bumps one minor
   ONLY if its file changed (it will — R4) — take the version current at
   implementation time (0.16.0 → 0.17.0 if TASK-79 lands first; else 0.15.0 →
   0.16.0 and expect a reconcile); `node scripts/sync-version.mjs <next free minor
   vs origin/main>` at merge-readiness (siblings in flight — on tag rejection,
   re-sync next free and re-pin). Wiki: `pdlc-plugin.md` NEEDS-REVIEW (template is
   its source); `pdlc-sweep.md` NEEDS-REVIEW (one-line reference); classify
   lockstep siblings (expect RE-PIN-ONLY); regenerate CAPSULES only if a
   description changes.
5. **Gates:** node --test (plant tests cover the template — check test/pdlc
   expectations if the block text is asserted), check-docs, freshness, version-bump
   — green in worktree; re-run after any history move.

## Risks

- Concurrent TASK-79 on sweep SKILL.md — keep R4 to one clause at a location 79
  doesn't touch; serial merge reconciles.
- The planted block is also this repo's CLAUDE.md content via check-docs sync — if
  check-docs pins template↔CLAUDE.md equality, the repo CLAUDE.md may need the same
  bullet in the same PR; run check-docs early to find out.
