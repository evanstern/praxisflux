---
id: TASK-0123
title: stop-docs-window test teardown races git on .git rmdir (CI-only flake)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-09 19:53'
updated_date: '2026-09-14 17:42'
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
- [x] #6 Spec phase: Phase 1 — confirm the mechanism (R1)
- [x] #7 Spec phase: Phase 2 — the shared teardown helper (R2)
- [ ] #8 Spec phase: Phase 3 — prove it, negative-controlled (R3, R4)
- [ ] #9 Spec phase: Phase 4 — sibling audit and close (R5)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NON-DETERMINISM CONFIRMED BY EVIDENCE, not inference (2026-09-09). CI run 34397432814 on commit 06d9be0 FAILED with the ENOTEMPTY teardown error; re-running the same failed job on the SAME commit, with no code change, PASSED. Same sha, same code, opposite outcome — that is the definition of a flake and rules out a real regression in the wiki re-pin commit. Locally the target test passed 3/3 in isolation.

So main is green and this card is genuine tech debt rather than a blocker. Deliberately NOT worked now: it is unrelated to the sweep's scope (TASK-112/113 and TASK-0122), and expanding into it mid-sweep would be exactly the silent scope creep the board rules forbid. Carded for a later sweep with the evidence attached so the next session does not have to re-derive the mechanism.

One thing for whoever takes it: do NOT 'fix' this by adding a retry loop and calling it proven. TASK-114's precedent in this repo is the standard — it took 20/20 consecutive green runs read from the raw log, not a summary, before the same-second run-id flake was called fixed. AC#3 here asks for that shape of evidence on purpose.

Spec: specs/070-teardown-race

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5 (Phases 1-2 — mechanism investigation + shared teardown helper; served verified from transcript, 140k tokens / 31 tool uses)

MECHANISM: NOT CONFIRMED, and recorded as such (AC#1 asks for evidence, not inference). The handle-holder could not be observed or reproduced on darwin: 1500+ iterations of the exact fixture-then-immediate-rmSync sequence (300 serial + 8x150 parallel) produced zero ENOTEMPTY. On this machine core.fsmonitor is unset, no git maintenance scheduler is registered, and repo hooks are all non-executable .sample files, so no background git process is plausible here. CI runs ubuntu-latest (.github/workflows/ci.yml:14,72) — a different kernel and filesystem, which is the gap the card itself anticipated. So the fix is defensive against the CLASS of hazard (something still walking .git when rmSync's readdir/rmdir pair runs), not a confirmed single culprit. What IS established: force:true does not cover this case at all — per Node's fs docs it suppresses errors only for a path that no longer exists, and does nothing for a directory that is non-empty when rmdir fires, which is exactly ENOTEMPTY. Retry is the fix; a stronger force does not exist.

HELPER PLACEMENT (orchestrator decision, recorded because the count evidence AC#3 wants depends on it). The helper lives flat at test/fixture-teardown.mjs. Consequence: 'node --test' with no glob collects EVERY .mjs under test/, so the helper is collected as an empty passing test file and the suite total goes 626 -> 627. That +1 is the helper module, not a new test. Two alternatives were tried and rejected: lib/ (the check-docs gate correctly failed it — lib/ is the documented plugin chassis, so it would need a README chassis entry AND would make a test-only change released surface, owing a version bump the runbook explicitly says this task does not owe); test/support/ (still collected — a subdirectory does not escape the default collector). Also corrected: the card and spec said seven rmSync teardown sites; there are six (the seventh match is the import line).
<!-- SECTION:NOTES:END -->
