# Spec 070 — fixture teardown must not race git on `.git` removal

**Task:** TASK-0123 · **Status:** draft · **Created:** 2026-09-14

## Problem

`test/stop-docs-window.test.mjs` builds each fixture by running `git init` in a `mkdtemp`
directory (`:26-44`) and tears it down with `rmSync(dir, { recursive: true, force: true })`
(seven sites: `:67, :77, :95, :117, :127, :138, …`). On CI that teardown intermittently
fails:

    not ok 499 - stop-docs window: a non-staleness gate failure => BLOCKS (the window has no opinion)
    ENOTEMPTY: directory not empty, rmdir '/tmp/stop-window-at3MKx/.git'
      at test/stop-docs-window.test.mjs:80

Observed 2026-09-09 on `main`, CI run 34397432814, commit `06d9be0` — a `docs/wiki` re-pin
commit that touches no test code. 547 of 548 tests passed; the single failure was in
teardown, not in an assertion.

**Non-determinism is confirmed by evidence, not inferred.** Re-running the same failed job
on the SAME commit, with no code change, PASSED. Same sha, same code, opposite outcome.
That rules out a regression in the re-pin commit and establishes this as a flake.

**Ruled out:** the failing commit touches only `docs/wiki/*.md`;
`test/stop-docs-window.test.mjs` is untouched since TASK-102 (`b377144`) and was not
modified by TASK-112, TASK-0122, or the wiki re-pin work.

**Mechanism (hypothesis — AC#1 requires it confirmed from evidence, not assumed).** A git
background process (fsmonitor, or an auto-gc / index write) can still hold a handle under
`.git` when `rmSync` walks it, so the `rmdir` of `.git` fails with ENOTEMPTY even under
`force: true` — `force` suppresses *missing-path* errors, not a non-empty directory. CI's
slower, contended filesystem widens the window; the target test passed 3/3 locally in
isolation.

**Why this is worth a task.** TASK-114 fixed a same-second run-id flake in this same suite
with 8 lines, and its notes record that ONE red gate amplified into 55 phantom spec-bridge
findings. The cost of a flake here is not one red run — it is every session downstream
mistrusting the gate, which is precisely the pathology this repo's advisory-local /
authoritative-CI split depends on avoiding.

## Requirements

- **R1 — mechanism confirmed, not inferred.** Name what actually holds the `.git` handle,
  from evidence. If the specific holder cannot be observed, say so explicitly and state
  what WAS established, rather than asserting the hypothesis as fact. (AC#1)
- **R2 — teardown made robust, and the fix named as which kind it is.** Either
  retry-with-backoff around `rmSync`, or the fixture stops leaving a live git dir behind.
  The spec does not pre-pick; the choice is stated in `plan.md` with its reason. (AC#2)
- **R3 — proof of stability in TASK-114's shape.** N consecutive green runs with N and the
  RAW counts recorded, read from real output, not a summary. A retry loop that is merely
  plausible does not satisfy this. (AC#3)
- **R4 — assertions not weakened.** The four stop-docs window behaviours still fail loudly
  when the window logic regresses. A teardown fix must not become a way for a real failure
  to pass. Demonstrated by negative control. (AC#4)
- **R5 — siblings audited.** Every other test using the same git-init-in-`mkdtemp` fixture
  pattern is fixed or explicitly cleared, with the verdict recorded per file. (AC#5)

## Scope finding (2026-09-14, verified in the worktree)

AC#5's audit surface is **wider than the card implies**. Sixteen test files use
`mkdtempSync` + `git init` + `rmSync` teardown:

`board-mirror`, `board-provider-seam`, `branch-held-specs`, `grounding-wiki.capsules`,
`grounding-wiki.freshness`, `pdlc`, `pre-push-hook`, `project-gates`, `repin-window`,
`root-guard-hook`, `run-gates`, `spec-source`, `stop-docs-window`, `team-review`,
`triage-offload`, `version-bump`.

This is a **statement of the audit's real size, not a scope expansion** — AC#5 already
demands it. The economical answer is a shared fixture-teardown helper the whole suite uses,
so the fix is one implementation rather than sixteen; `plan.md` decides. If the audit
surfaces a sibling needing more than the shared helper, that is a finding to report, not
work to silently absorb.

## Non-goals

- Changing what any stop-docs window behaviour asserts, or the freshness gate itself.
- "Fixing" the flake by retrying the *test* or by loosening an assertion — the failure is
  in teardown; a fix that touches the assertion path is the wrong fix.
- Disabling fsmonitor/auto-gc globally for the repo, or mutating tracked git config.
- Chasing the CI runner's filesystem characteristics; the fix must be correct on any FS.

## Requirement → acceptance-criterion map

| AC | Requirement |
|----|-------------|
| #1 Mechanism reproduced or confirmed from evidence, naming the handle holder | R1 |
| #2 Teardown robust, fix stated as which kind | R2 |
| #3 N consecutive green runs, N and raw counts recorded | R3 |
| #4 Fix does not weaken the four window behaviours | R4 |
| #5 Sibling tests on the same pattern audited and fixed or cleared | R5 |

## Evidence at HEAD (verified 2026-09-14)

- `test/stop-docs-window.test.mjs:26-44` — `fixture()`: `mkdtempSync` then `git init`.
- `test/stop-docs-window.test.mjs:67,77,95,117,127,138` — the `rmSync` teardown sites.
- `test/stop-docs-window.test.mjs:80` — the line CI's ENOTEMPTY named.
- Sixteen sibling files share the pattern (enumerated above).
