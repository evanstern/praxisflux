---
id: TASK-0123
title: stop-docs-window test teardown races git on .git rmdir (CI-only flake)
status: To Do
assignee: []
created_date: '2026-09-09 19:53'
updated_date: '2026-09-09 19:54'
labels:
  - tech-debt
  - flake
  - gates
dependencies: []
priority: medium
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a developer, I want test/stop-docs-window.test.mjs to tear down its fixtures reliably, so that an intermittent ENOTEMPTY does not fail CI on unrelated commits.

Observed 2026-09-09 on main (run 34397432814, commit 06d9be0 — a docs/wiki re-pin commit that touches no test code): 'not ok 499 - stop-docs window: a non-staleness gate failure => BLOCKS (the window has no opinion)' with error ENOTEMPTY: directory not empty, rmdir '/tmp/stop-window-at3MKx/.git' at test/stop-docs-window.test.mjs:80. 547 of 548 passed; the one failure was teardown, not an assertion.

MECHANISM (hypothesis, needs confirming): fixture() runs 'git init' in a mkdtemp dir, and each test tears down with rmSync(dir, {recursive:true, force:true}). A git background process (fsmonitor, or an auto-gc/index write) can still hold a handle under .git when rmSync walks it, so the rmdir of .git fails with ENOTEMPTY even though force:true. This is a classic CI-only race: the runner's slower/contended FS widens the window. Passed 3/3 locally when re-run in isolation.

NOT the cause, ruled out: the commit that failed touches only docs/wiki/*.md; test/stop-docs-window.test.mjs is untouched since TASK-102 (b377144) and was not modified by TASK-112, TASK-0122, or the wiki re-pin work.

Sibling precedent: TASK-114 fixed a same-second run-id flake in this suite with 8 lines of production code, and its notes record that ONE red gate amplified into 55 phantom spec-bridge findings. The cost of leaving a flake here is not one red run — it is every session downstream mistrusting the gate, which is exactly the pathology this repo's advisory-local/authoritative-CI split depends on avoiding.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The ENOTEMPTY teardown race is reproduced or its mechanism confirmed from evidence (not inferred), naming what holds the .git handle
- [ ] #2 Teardown is made robust — e.g. retry-with-backoff around rmSync, or the fixture stops leaving a live git dir behind — and the fix is stated as which of those it is
- [ ] #3 Proof of stability: the target test (or the suite) runs N consecutive times green, with N and the raw counts recorded, in the style of TASK-114's 20/20 evidence
- [ ] #4 The fix does not weaken what the test asserts: the four stop-docs window behaviours still fail loudly when the window logic regresses
- [ ] #5 Any other test in the suite using the same git-init-in-mkdtemp fixture pattern is audited and fixed or explicitly cleared
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NON-DETERMINISM CONFIRMED BY EVIDENCE, not inference (2026-09-09). CI run 34397432814 on commit 06d9be0 FAILED with the ENOTEMPTY teardown error; re-running the same failed job on the SAME commit, with no code change, PASSED. Same sha, same code, opposite outcome — that is the definition of a flake and rules out a real regression in the wiki re-pin commit. Locally the target test passed 3/3 in isolation.

So main is green and this card is genuine tech debt rather than a blocker. Deliberately NOT worked now: it is unrelated to the sweep's scope (TASK-112/113 and TASK-0122), and expanding into it mid-sweep would be exactly the silent scope creep the board rules forbid. Carded for a later sweep with the evidence attached so the next session does not have to re-derive the mechanism.

One thing for whoever takes it: do NOT 'fix' this by adding a retry loop and calling it proven. TASK-114's precedent in this repo is the standard — it took 20/20 consecutive green runs read from the raw log, not a summary, before the same-second run-id flake was called fixed. AC#3 here asks for that shape of evidence on purpose.
<!-- SECTION:NOTES:END -->
