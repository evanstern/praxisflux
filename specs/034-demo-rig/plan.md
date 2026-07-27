# 034-demo-rig — plan

1. Read the surfaces first: the demoed skills' SKILL.mds (pdlc sweep +
   refactor-triage, grounding-wiki wiki-build/wiki-update, spec-bridge link/sync,
   research research-vault) — the capture run must drive them as written;
   `scripts/run-gates.mjs` (the per-stage gate assertion surface and its exit-code
   contract); `docs/consuming-gates.md` (how a consumer repo — which the demo project
   is — runs the gates); [[test-suite-catalog]] for where the CI test's bullet lands.
2. **Scaffold the demo app + generator skeleton** (`demo/generate.mjs`): materialize
   an empty target dir OUTSIDE the checkout (explicit cwd on every git call),
   deterministic commit identity/dates (fixed GIT_AUTHOR_DATE ladder), tag helper,
   `--stage N` checkout convenience, `--reset` semantics (wipe + regenerate), and the
   optional `--remote <url>` force-push wiring (default off; never in CI). Stage-0
   fixture: the tiny tamagotchi CLI (a few files, `node --test`-able).
3. **Capture run (the agentic leg, done once):** in a scratch clone of the generated
   stage-0 repo, genuinely run the plugins — research vault branch + wiki-build
   (→ stage-1 fixtures); backlog board + hand-authored spec dirs + spec-bridge:link +
   a signed-off mini sweep runbook (→ stage-2, including the live-thread task
   pre-specced and UNMERGED); execute the mini sweep for real against the
   operator-named sandbox remote — merged PRs, board synced via spec-bridge:sync,
   wiki re-pinned (→ stage-3, including the live task's merged twin); run
   refactor-triage headless with a declared policy — triage record + debt cards
   (→ stage-4). Snapshot each stage's tree into `demo/fixtures/stage-N/` plus a
   manifest recording the narrative (task IDs, tag names, PR numbers). OPERATOR
   CHECKPOINT before creating the sandbox repo (runbook: confirm owner/name).
4. **Replay:** the generator commits fixtures stage by stage (deterministic dates →
   reproducible history), tagging each; verify captured wiki pins resolve against the
   replayed history (pins reference the replayed commits — capture and replay must
   agree; if they can't be made to agree byte-for-byte, the capture step rewrites
   pins to the replayed hashes ONCE at fixture-snapshot time, honestly, against the
   identical tree).
5. **Per-stage gate matrix** in the generator (`--check`): stage-1/3/4 →
   `run-gates.mjs wiki-freshness`; stage-2/3 → `run-gates.mjs spec-bridge`; stage-0 →
   demo app's own `node --test`.
6. **CI test** `test/demo-rig.test.mjs`: generate → tags exist → per-stage matrix
   passes → generate AGAIN → identical task IDs / tags / stage tree hashes (R8).
   Catalog bullet in [[test-suite-catalog]] (repo-tooling half) in the same PR — mind
   TASK-78's budget note: extend, don't bloat.
7. **Runsheet** `demo/RUNSHEET.md` (R5): minute-by-minute, the two live gate moments,
   live-task kickoff/close, triage beat, fallback pivots.
8. Docs: root `README.md` gains the rig (what it is, how to reset/demo); `CLAUDE.md`
   only if check-docs demands. Wiki (same PR): new note `docs/wiki/demo-rig.md`
   (sources per R7) + INDEX + CAPSULES regen; any note whose pinned sources this PR
   touches classified RE-PIN-ONLY vs NEEDS-REVIEW against the actual diff.
9. Gates in the worktree: `node --test`, `scripts/check-docs.mjs`, wiki freshness,
   `check-version-bump` (expect: no bump — demo/+test/+docs only; believe the gate).
10. Board finalized (ACs checked; Done via spec-bridge:sync only), PR (reason to
    approve: the repo gains a self-gating, repeatable demo of its own lifecycle —
    presenter tooling + CI contract that the demo cannot rot), merge as a merge
    commit, re-ground.
