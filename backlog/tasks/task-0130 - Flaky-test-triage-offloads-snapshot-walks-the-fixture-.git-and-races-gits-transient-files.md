---
id: TASK-0130
title: >-
  Flaky test: triage-offload's snapshot() walks the fixture .git/ and races
  git's transient files
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-11 16:04'
updated_date: '2026-09-11 19:07'
labels:
  - flake
  - tests
  - debt
dependencies: []
priority: high
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`test/triage-offload.test.mjs`'s `snapshot()` helper (lines 71-79) recursively walks a real `git init` fixture — INCLUDING its `.git/` directory — and races git's own transient files. Measured: 31 of 32 snapshot entries are git internals.

The mechanism is a two-step TOCTOU: `readdirSync(dir, {recursive:true})` lists every path, then `statSync(p)` visits each one. Any file git creates-then-removes in that window throws ENOENT out of `statSync` and kills the test.

Observed twice with different victims, one line of code:

- CI run 34521158349 **on `main`** at 5748bd89: `ENOENT: stat '/tmp/triage-offload-88szOa/.git/objects/maintenance.lock'`
- Local reproduction: `ENOENT: stat '.../triage-offload-lqHzvl/.git/objects/06'` (a loose-object shard dir)

Both land on `test/triage-offload.test.mjs:76`'s `statSync`.

Frequency is low and load-dependent — roughly 1 hit in 20 full-suite runs — which is why it reads as random CI failure rather than a broken test. It blocked PR #144 (run 34616221159) and cleared on a bare re-run with no code change.

PRE-EXISTING, not introduced by PR #144: the file is byte-identical between `origin/main` and that branch (`git diff --quiet` → 0), was introduced by `40c7c9c` (TASK-0127), and `git merge-base --is-ancestor 40c7c9c origin/main` confirms it is on `main`. Verified independently by the orchestrator, not just reported.

THE FIX (one line, and it strengthens the assertion): `snapshot()` must not walk `.git/` at all. Its purpose is to assert "the script writes nothing" about the WORKING TREE; git internals are not the script's output, so excluding them removes the race and removes noise that was never signal.

Do NOT fix this with a retry, a try/catch around `statSync`, or a test-level skip — each papers over a real TOCTOU while leaving the helper asserting things it does not mean to assert.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 snapshot() in test/triage-offload.test.mjs no longer walks the fixture's .git/ directory, and the exclusion is stated in a comment explaining that git internals are not the script's output
- [ ] #2 The fix is a filter/predicate, NOT a retry, a try/catch around statSync, or a skip — the race is removed rather than tolerated
- [ ] #3 The 'writes nothing' assertions still hold and still fail if the script under test actually writes to the working tree (verified by a deliberate mutation, not assumed)
- [ ] #4 A repeated full-suite run (20+ iterations) produces no ENOENT from this helper
- [ ] #5 Any other test helper in the suite that recursively stats a real git fixture is checked for the same TOCTOU and either fixed or explicitly noted as safe
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Ad-hoc mode (operator: 'Fix now, yes' 2026-09-11): one-line fix per the card's own spec — exclude .git/ from snapshot()'s walk in test/triage-offload.test.mjs. Dispatch at haiku (narrow mechanical single-file edit). Branch task-0130-snapshot-flake, one PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Third observation, NEW failure mode (2026-09-11, run 34636067878 on main at dda6a71 — a board-only commit, no code change): .git/objects/maintenance.lock appeared in the AFTER snapshot but not the BEFORE, so instead of the ENOENT crash the test failed its byte-identical assertion ('the script must write nothing') with the lock file as the only diff. Same root cause — snapshot() walking .git/ — two symptoms: transient file dies between readdir and stat (ENOENT), or survives into one snapshot but not the other (false diff). The carded fix (exclude .git/ from the walk) removes both.

Dispatch: tier=haiku pinned=cc/claude-haiku-4-5-20251001 served=claude-haiku-4-5-20251001
Fix landed (d7e8a87): one-line first-segment .git exclusion in snapshot(); 5/5 consecutive runs of the file green, full suite 624/624. PR #147 open.
<!-- SECTION:NOTES:END -->
