# 033-refactor-triage — plan

1. Read the surfaces first: `docs/skill-patterns.md` (the gate→work→gate shape and the
   frontmatter the bump gate keys on), `pdlc/skills/sweep/SKILL.md` (house voice for an
   orchestrator skill; its Handing off section is R8's edit target),
   `team-review/skills/team-review/SKILL.md` (the lens parameter the Evaluate phase
   rides; how a caller invokes it and where reports/run records land), and the pinned
   wiki notes [[pdlc-plugin]], [[pdlc-sweep]], [[team-review-plugin]].
2. Author `pdlc/skills/refactor-triage/SKILL.md` (version 0.1.0): precondition gate
   (a git repo; a `backlog/` board — no board, nothing to execute onto; range mode
   needs a resolvable `xxx..yyy`), then the four phases from the card — Scope (three
   entry modes, R2) → Evaluate (team-review orchestration + graceful inline
   degradation, R3; intent-drift pass in range mode, R4) → Triage (operator walk or
   declared headless policy; tracked run-id-keyed record under `docs/reviews/`, R5) →
   Execute (accepted findings → cited, labeled backlog tasks via the CLI, R6) — and
   the prose output gate (R7). Handing off: name the natural next step (a sweep over
   the new debt tasks).
3. R8: edit `pdlc/skills/sweep/SKILL.md`'s Handing off section to name refactor-triage
   as the post-sweep review step; bump that skill's `version:`.
4. Tests in `test/pdlc.test.mjs` (extend the existing file; a NEW test file would need
   its own catalog bullet): the new SKILL.md carries the frontmatter the bump gate
   keys on; the skill states all three entry modes and the output gate; sweep's
   Handing off names refactor-triage. Keep `node --test` green.
5. Docs: `pdlc/README.md` gains the skill; root `README.md`/`CLAUDE.md` only if
   check-docs demands (pdlc plugin row already exists; the planted PDLC grounding
   block is bootstrap's surface, not this task's).
6. Wiki (same PR): new note `docs/wiki/pdlc-refactor-triage.md` (sources: the new
   SKILL.md) + INDEX entry; amend [[pdlc-plugin]] (its description says "the second
   skill, sweep" — now three skills) and [[pdlc-sweep]] (Handing off prose) as
   NEEDS-REVIEW re-pins against the actual diff; regenerate CAPSULES.md in the same
   slice as any description change.
7. Gates in the worktree: `node --test`, `scripts/check-docs.mjs`, wiki freshness.
   Version bump: pdlc/ released surface → `node scripts/sync-version.mjs 0.40.0`
   (re-check the next free number at merge-readiness) + both skill `version:` bumps.
8. Board finalized (ACs checked; Done via spec-bridge:sync only), PR (reason to
   approve: the PDLC gains a new lifecycle verb — the post-sweep debt-triage seam
   becomes owned, its artifacts and gate binding), merge as a merge commit, re-ground.
