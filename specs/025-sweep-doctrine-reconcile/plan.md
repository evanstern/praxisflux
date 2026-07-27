# 025-sweep-doctrine-reconcile — plan

1. Re-read the post-TASK-58 doctrine set end to end: `pdlc/skills/sweep/SKILL.md`
   (precondition gate, Phase 2 loop, re-ground step, concurrency doctrine),
   `pdlc/skills/sweep/templates/runbook.md` (claim protocol, drift-gate bullets),
   `docs/wiki/pdlc-sweep.md`, `pdlc/templates/CLAUDE.md` (enforcement sentence),
   `spec-bridge/skills/sync/SKILL.md` (Done ownership), and each plugin's
   `hooks/hooks.json` presence (the ship-reality for R5).
2. R1: write the claim step into the Phase 2 loop as its own numbered step before spec
   authoring (board → In Progress + spec dir stub + push -u), renumber, and fix the
   worktree-cut sentence; align the runbook template's claim paragraph; the wiki
   description follows.
3. R2: rewrite the unrelated-rejection remedy merge-based; sweep both files for any
   remaining rebase-the-claim or force-push-requiring instruction; align wiki.
4. R3: unify the drift-gate inventory — SKILL precondition gate documents and probes
   all four modes with invocations verbatim; runbook template lists the same four.
5. R4: reorder the re-ground step (tick tasks.md at root → spec-bridge:sync → sync
   moves status/Done per its doctrine → final summary via sync's plan or explicitly
   sanctioned edit); remove hand-set-Done phrasing that contradicts sync-only-Done.
6. R5: rewrite the planted enforcement sentence to per-reality phrasing (which plugins
   ship Stop hooks; wiki freshness enforced by check scripts/CI, not a hook).
7. Versions: sweep SKILL.md bump (minor); check whether templates/CLAUDE.md rides the
   bootstrap skill's version (precedent: TASK-53/54 bumped bootstrap for plant
   changes) and bump accordingly; `node scripts/sync-version.mjs <next free>`.
8. Wiki re-ground: `pdlc-sweep` + `pdlc-plugin` re-verified against the actual diff,
   amended, re-pinned; lockstep stales classified per the honest-re-pin loop; CAPSULES
   regen if descriptions changed.
9. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
