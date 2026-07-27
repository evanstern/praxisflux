# 023-reorient-target-root — plan

1. Read `reorient/scripts/run.mjs` end to end (module-load RUNS, per-command target
   resolution, worktree-first refusal, heartbeat), `gates/reorient.mjs` resolveRoots,
   `runsDirFor` in its home module, and the SKILL.md records-location claim.
2. R1: drop the module-load `RUNS` constant; each command resolves
   `runsDirFor(<resolved target root>)` after parsing its args. Preserve
   REORIENT_HOME override and the .git/.handoff ancestor-walk semantics.
3. R3: point the worktree-first check (.git dir vs gitdir: file) at the target root's
   checkout, not process.cwd(); keep the --shared-checkout override recording
   unchanged.
4. R2 falls out of R1 (registry now under the target) — verify resolveRoots picks the
   run up from a session rooted in the target.
5. R4: cross-directory tests in `test/reorient*.test.mjs`: begin-from-elsewhere
   writes under the target; gate fires in-target; finish-from-target passes;
   refusal keyed to the target checkout (worktree→primary refused,
   elsewhere→worktree accepted).
6. SKILL.md wording aligned. Versions: reorient skill bump + `node
   scripts/sync-version.mjs <next>`; wiki re-verify + re-pin `reorient-plugin` +
   `reorient-run-ownership` (+ lockstep stales); CAPSULES if descriptions changed.
7. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
