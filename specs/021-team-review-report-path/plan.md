# 021-team-review-report-path — plan

1. Read `team-review/scripts/run.mjs` (default report resolution, run-id generation,
   runsDirFor), `team-review/gates/review.mjs` (in-target block + porcelain check),
   `reorient/scripts/run.mjs:163-165` (run-id-keyed target naming, the prior art), and
   the SKILL.md report-path paragraph.
2. R1+R3: default report path → under the runs home (same root `runsDirFor` resolves,
   TEAM_REVIEW_HOME-overridable), filename keyed by the run id (which already exists
   per run record). If cwd is outside the target, keeping cwd as the base is
   acceptable only if it can never equal/contain the target — otherwise prefer the
   runs home unconditionally for the default. Explicit --report behavior unchanged.
3. R2: rewrite the SKILL.md claim to state the actual rule (default lives under the
   runs home, outside the target; self-review safe by construction).
4. R4: extend `test/team-review*.test.mjs`: self-review round trip with no --report
   (begin . → write report at printed default → finish exits 0); two begins same day
   → distinct default paths.
5. Versions: team-review SKILL.md version bump + `node scripts/sync-version.mjs
   <next>`; wiki re-verify + re-pin `team-review-plugin` (+ lockstep stales); CAPSULES
   if description changed.
6. Prove: node --test, check-docs.mjs, wiki freshness gate, bump gate; board
   finalized; PR.
