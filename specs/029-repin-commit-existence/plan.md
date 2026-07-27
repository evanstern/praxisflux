# 029-repin-commit-existence — plan

1. In the worktree, extend `repin()` in `grounding-wiki/scripts/repin.mjs`: after the
   format/existence/pin-line checks and BEFORE the write, run
   `git -C <dirname(notePath)> cat-file -e <hash>^{commit}` (execFileSync, stdio
   ignored). Nonzero → throw `commit does not exist in the corpus repo: <hash>` (or a
   not-a-git-repo variant when the probe itself cannot run).
2. Keep the function's contract otherwise byte-compatible: same success return (old
   pin), same existing error messages, CLI exit codes unchanged (2 usage, 1 refusal).
3. Regression test in `test/grounding-wiki.freshness.test.mjs`: in a fixture corpus git
   repo, call repin with a well-formed hash naming no commit → assert throw names the
   hash and the note file is unchanged; assert a real commit hash still repins; keep
   the existing refusals test green. (The freshness fixtures already build git repos —
   reuse their helpers.)
4. Gates in the worktree: node --test, check-docs.mjs, wiki freshness. Version bump:
   grounding-wiki/ is released surface → marketplace lockstep bump via
   scripts/sync-version.mjs at merge-readiness (no SKILL.md edited → no skill bump).
5. Same-PR wiki re-pins as the freshness gate demands — expect
   docs/wiki/grounding-wiki-plugin.md (repin.mjs is a source) and
   docs/wiki/test-suite-catalog.md (the freshness test file is a source).
6. Board finalized (ACs checked, Done, final summary); PR (reason to approve: the
   corpus's one pin-writer gains a hard refusal — a verification-claim contract
   tightens); merge; re-ground.
