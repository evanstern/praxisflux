# 031-team-review-residue-policy — plan

1. Read the TASK-61 surface first: `team-review/scripts/run.mjs` (begin's default
   report path under `reportsDirFor(cwd)`, the self-review WARN), `gates/review.mjs`
   (checkReview's untouched-target check and its `.handoff/` exemption), and the
   TASK-61 tests in `test/team-review.test.mjs`.
2. Implement policy (b), operator-decided 2026-07-27 (sweep-followups runbook,
   Operator checkpoints): on a SELF-REVIEW (invoking root == target) that used the
   DEFAULT report path, `finish` — after the output gate passes — lands the proven
   report at a tracked location in the target (prior art: `docs/reviews/
   team-review-<run-id>.md`; run-id-keyed so same-day runs never collide) and records
   both paths on the run record. Copy-on-finish keeps begin's deadlock fix intact:
   the gate still verifies the transport-side report against the pre-review snapshot,
   and the tracked copy appears only after verification, so the untouched-target
   check never sees it.
3. Explicit `--report` always wins (no copy); non-self-review flow byte-unchanged;
   the self-review WARN at begin updated to say where the report will durably land.
4. Record ONE rule in both `team-review/skills/team-review/SKILL.md` and
   `docs/wiki/team-review-plugin.md`: a review report is EVIDENCE and lives tracked;
   the transport is transient plumbing; self-review defaults copy-on-finish.
5. Tests: TASK-61 suite stays green (default-path round trip, same-day distinct
   paths, deadlock regression); new test covers the pure-defaults self-review round
   trip ending with the tracked copy present and the run record naming it.
6. Gates in the worktree: node --test, check-docs.mjs, wiki freshness. Version bump:
   team-review/ released surface + SKILL.md edited → marketplace lockstep bump AND
   the skill's own `version:` bump.
7. Same-PR wiki re-pin: docs/wiki/team-review-plugin.md (run.mjs, review.mjs,
   SKILL.md are sources) states the recorded rule; test-suite-catalog if the test
   set changes.
8. Board finalized (ACs checked, Done, final summary); PR (reason to approve: a
   durable-residue POLICY is ratified — evidence must live tracked — and the plugin's
   behavior is bound to it); merge; re-ground.
