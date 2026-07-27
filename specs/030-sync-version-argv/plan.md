# 030-sync-version-argv — plan

1. Audit call sites first: grep the repo (hooks, CI, docs, scripts, tests) for
   `sync-version` invocations — confirm which modes are actually consumed (--check in
   pre-commit; explicit versions in release flow/docs) and that nothing depends on the
   bare no-arg sync mode. Record findings in the PR.
2. In `scripts/sync-version.mjs`, validate argv before touching any file: accept
   exactly `--check` or one strict `x.y.z` (`/^\d+\.\d+\.\d+$/`). Anything else —
   missing arg, `--help`-style flags, extra args, non-semver — prints usage to stderr
   and exits 2 (the TASK-66 build.mjs pattern). Update the header comment: the bare
   no-arg sync mode is removed.
3. Decide-and-record (per the card): a version at or below the current lockstep value
   is ALLOWED — the CLI stays a dumb stamper (repair/rollback stays possible);
   check-version-bump already gates increases at PR time. Stated in spec.md; no flag
   added.
4. Regression test (new `test/sync-version.test.mjs`, or the existing suite if a
   better home is found): refusal cases exit 2 with usage and leave every version file
   byte-identical (content compare across marketplace.json, a plugin.json, action.yml);
   valid `x.y.z` still stamps all 11 files; `--check` behavior unchanged. If a NEW test
   file is created, add its `docs/wiki/test-suite-catalog.md` bullet + source in the
   same PR.
5. Gates in the worktree: node --test, check-docs.mjs, wiki freshness. Version bump:
   scripts/ is released surface → marketplace lockstep bump via the (now-validated)
   sync-version.mjs at merge-readiness.
6. Same-PR wiki re-pins as the freshness gate demands — expect
   docs/wiki/build-and-release.md and/or docs/wiki/release-pipeline.md (sync-version
   is a pinned source) and docs/wiki/test-suite-catalog.md if the test set changes.
7. Board finalized (ACs checked, Done, final summary); PR (reason to approve: a
   release-surface CLI gains input validation and sheds an undocumented mode — the
   lockstep stamping contract tightens); merge; re-ground.
