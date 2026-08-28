# 058 — Tasks

## Phase 1 — the git spec-source resolver

- [x] Create `lib/spec-source.mjs` exporting `resolveSpecSource(specDir)` returning
      `{ has, read, source }`.
- [x] Worktree path: when `existsSync(specDir)`, back `has`/`read` with `fs` and set
      `source = { kind: "worktree", path: specDir }`; return before any git call.
- [x] Ref enumeration: local `HEAD`, then `refs/remotes/origin/task-*` via
      `git for-each-ref`, computed once per process and memoized.
- [x] Ref reads via `execFileSync("git", [...])` (argv form, never a shell string) with
      `stdio: ["ignore", "pipe", "ignore"]`; only `show` / `ls-tree` / `rev-parse` /
      `for-each-ref`.
- [x] Select the first ref whose tree contains `<specDir>/spec.md`; memoize per `(ref, path)`.
- [x] Degrade without throwing when git is missing, the dir is not a repo, or no ref matches.
- [x] Unit tests in `test/spec-source.test.mjs` against a real scratch repo in a temp dir
      (real commits, real branch — no mocks).

## Phase 2 — wire the resolver into the derivation

- [x] `deriveSpecState` obtains `has`/`read` from `resolveSpecSource(specDir)` instead of
      closing over `fs` directly.
- [x] Thread `source` into the returned state as `source` (additive field only).
- [x] Confirm no other line of `lib/spec-derive.mjs` changes.
- [x] `node --test test/spec-derive.test.mjs test/phase-status.test.mjs` passes with **no**
      edits to existing assertions.

## Phase 3 — prove the branch-held scenario

- [x] Test: spec dir committed only on a branch derives its true stage from a checkout that
      does not contain it (AC1).
- [x] Test: a worktree spec dir wins over a ref carrying a different version (AC2).
- [x] Test: absent everywhere → today's "nothing proven", no throw (AC3).
- [x] Test: `git status`, HEAD and the index are unchanged after a derivation (AC4).
- [x] Test: a directory with no `.git` derives without error (AC8).
- [x] Test: refs enumerated once across two derivations of the same spec dir (AC6).
- [x] Test: `source` provenance names the worktree or the specific ref (AC7).
- [x] Full suite green: `node --test test/`.

## Phase 4 — grounding and release

- [x] Run `node grounding-wiki/gates/cli.mjs plan . docs/wiki`; classify each stale note
      RE-PIN-ONLY vs NEEDS-REVIEW.
- [x] Amend note prose for NEEDS-REVIEW entries **before** moving any pin.
- [x] Re-pin the classified notes to this branch's merge target.
- [x] Bump marketplace version and any edited skill's `version:` per `docs/releasing.md`.
- [x] `node scripts/check-docs.mjs` and the wiki freshness gate both green.
