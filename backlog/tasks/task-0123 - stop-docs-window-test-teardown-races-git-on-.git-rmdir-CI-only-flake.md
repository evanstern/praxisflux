---
id: TASK-0123
title: stop-docs-window test teardown races git on .git rmdir (CI-only flake)
status: Done
assignee:
  - '@claude'
created_date: '2026-09-09 19:53'
updated_date: '2026-09-14 19:10'
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
- [x] #3 Proof of stability: the target test (or the suite) runs N consecutive times green, with N and the raw counts recorded, in the style of TASK-114's 20/20 evidence
- [x] #4 The fix does not weaken what the test asserts: the four stop-docs window behaviours still fail loudly when the window logic regresses
- [x] #5 Any other test in the suite using the same git-init-in-mkdtemp fixture pattern is audited and fixed or explicitly cleared
- [x] #6 Spec phase: Phase 1 — confirm the mechanism (R1)
- [x] #7 Spec phase: Phase 2 — the shared teardown helper (R2)
- [x] #8 Spec phase: Phase 3 — prove it, negative-controlled (R3, R4)
- [x] #9 Spec phase: Phase 4 — sibling audit and close (R5)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NON-DETERMINISM CONFIRMED BY EVIDENCE, not inference (2026-09-09). CI run 34397432814 on commit 06d9be0 FAILED with the ENOTEMPTY teardown error; re-running the same failed job on the SAME commit, with no code change, PASSED. Same sha, same code, opposite outcome — that is the definition of a flake and rules out a real regression in the wiki re-pin commit. Locally the target test passed 3/3 in isolation.

So main is green and this card is genuine tech debt rather than a blocker. Deliberately NOT worked now: it is unrelated to the sweep's scope (TASK-112/113 and TASK-0122), and expanding into it mid-sweep would be exactly the silent scope creep the board rules forbid. Carded for a later sweep with the evidence attached so the next session does not have to re-derive the mechanism.

One thing for whoever takes it: do NOT 'fix' this by adding a retry loop and calling it proven. TASK-114's precedent in this repo is the standard — it took 20/20 consecutive green runs read from the raw log, not a summary, before the same-second run-id flake was called fixed. AC#3 here asks for that shape of evidence on purpose.

Spec: specs/070-teardown-race

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phases 1-2 — mechanism investigation + shared teardown helper; served verified from transcript, 140k tokens / 31 tool uses] served=claude-sonnet-5

MECHANISM: NOT CONFIRMED, and recorded as such (AC#1 asks for evidence, not inference). The handle-holder could not be observed or reproduced on darwin: 1500+ iterations of the exact fixture-then-immediate-rmSync sequence (300 serial + 8x150 parallel) produced zero ENOTEMPTY. On this machine core.fsmonitor is unset, no git maintenance scheduler is registered, and repo hooks are all non-executable .sample files, so no background git process is plausible here. CI runs ubuntu-latest (.github/workflows/ci.yml:14,72) — a different kernel and filesystem, which is the gap the card itself anticipated. So the fix is defensive against the CLASS of hazard (something still walking .git when rmSync's readdir/rmdir pair runs), not a confirmed single culprit. What IS established: force:true does not cover this case at all — per Node's fs docs it suppresses errors only for a path that no longer exists, and does nothing for a directory that is non-empty when rmdir fires, which is exactly ENOTEMPTY. Retry is the fix; a stronger force does not exist.

HELPER PLACEMENT (orchestrator decision, recorded because the count evidence AC#3 wants depends on it). The helper lives flat at test/fixture-teardown.mjs. Consequence: 'node --test' with no glob collects EVERY .mjs under test/, so the helper is collected as an empty passing test file and the suite total goes 626 -> 627. That +1 is the helper module, not a new test. Two alternatives were tried and rejected: lib/ (the check-docs gate correctly failed it — lib/ is the documented plugin chassis, so it would need a README chassis entry AND would make a test-only change released surface, owing a version bump the runbook explicitly says this task does not owe); test/support/ (still collected — a subdirectory does not escape the default collector). Also corrected: the card and spec said seven rmSync teardown sites; there are six (the seventh match is the import line).

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phase 3 — stability proof and negative control; served verified from transcript, 171k tokens / 39 tool uses] served=claude-sonnet-5

STABILITY EVIDENCE (AC#3), reproduced INDEPENDENTLY by the orchestrator rather than accepted from the dispatch. 20 consecutive runs of node --test test/stop-docs-window.test.mjs, raw per-run counts: every run exit=0 pass=6 fail=0. 0/20 failures. Full suite 627 pass / 0 fail. That matches the dispatch's own 20/20, measured separately. WHAT IT DOES NOT PROVE, stated plainly per AC#3's intent: 20 green local runs BOUND the flake, they do not establish it is fixed. The race was never reproducible on this platform at all (Phase 1: 1500+ iterations, zero failures), CI runs ubuntu-latest on a different kernel and filesystem, and the helper is defensive against a class of hazard rather than a confirmed culprit. Absence of failure on a platform that could not produce the original bug is weak evidence by construction. The honest claim is: teardown can no longer fail on a transient ENOTEMPTY without five retries and an escalating backoff first, and if it still fails it does so loudly.

NEGATIVE CONTROL (AC#4) — the four window behaviours were shown to fail when the WINDOW logic regresses, not the teardown. Broke grounding-wiki/gates/repin-window.mjs at three points (fail-open instead of fail-closed on an unresolvable base ref; inverted the empty/non-empty git-log branch; .every -> .some across notes). Result 4 fail / 2 pass: 'stale from unmerged branch work => NOTICE' got block, 'nothing unmerged => BLOCKS' got notice, 'one excused note does not forgive an unexcused sibling' got notice, 'unresolvable base ref => BLOCKS' got notice. Tests 3 and 6 stayed green correctly — they bypass the window by design, which the tests themselves assert. Control proven non-inert by the clean before/after delta (6/6 green before, exactly the four window-consuming tests flipped after). Restored; tree verified clean at eb72f17. USEFUL FINDING for anyone repeating this: a naive one-line regression breaks only 3 of the 4, because the module has several independent fail-closed guards plus an AND-across-notes semantic — hitting all four takes a deliberate multi-point regression.

HELPER CONTRACT LEFT UNPINNED — a deliberate decision, recorded rather than hidden. removeFixtureDir's retry-and-re-throw contract has no test: nothing proves it retries on ENOTEMPTY or that it re-throws after the bound instead of swallowing (a swallowed error would convert a real leak into a passing test — the failure mode AC#4 guards). Three routes were investigated and each rejected on evidence: (1) reproducing a real ENOTEMPTY is impossible here, so the test would be as unreliable as the bug; (2) mock.method on node:fs throws TypeError — builtin ESM named exports are not configurable that way; (3) t.mock.module works ONLY under --experimental-test-module-mocks, a flag used nowhere in this repo, and 'node --test' with no flags is the literal gate name CI and spec-bridge check — so adding it would make that test pass locally and silently fail under the real CI invocation, which is worse than no test. The affordable closures are a project-wide decision to adopt that flag, or a DI refactor of the helper as its own small card. Neither is in this task's scope; flagged for triage rather than silently expanded into.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phase 4 — sibling audit and close; served verified from transcript, 250k tokens / 122 tool uses] served=claude-sonnet-5

SIBLING AUDIT (AC#5) — sixteen files, a verdict each, none skipped. ADOPTED (13, two of them partially): board-mirror, board-provider-seam, branch-held-specs, grounding-wiki.capsules, grounding-wiki.freshness, pdlc (partial — only gitPair/gitRoot are real git fixtures; proj() and the ci-checkout copy fixture never touch git), pre-push-hook, project-gates, repin-window, root-guard-hook, spec-source, team-review (partial — only makeTarget()'s repo; outside/home/elsewhere and a root fixture that merely fakes a .git dir are not git repos), triage-offload, version-bump. ALREADY DONE: stop-docs-window (phase 2). CLEARED WITH REASON (1): run-gates.test.mjs — verified zero rmSync calls anywhere in the file, so its mkdtemp fixtures are never removed and no removal can be raced. The partial adoptions are the point of an audit rather than a sweep: converting a non-git fixture would be cargo-culting, since the hazard is specifically a live .git being walked during removal. Every hazard site was a straight swap; no sibling needed bespoke handling, so there are no findings owed. SEPARATE PRE-EXISTING ISSUE, flagged not fixed: run-gates.test.mjs leaks its temp dirs entirely (no teardown at all). Harmless in CI since containers are ephemeral, out of scope here, and NOT this task's race.

CATALOG DECISION (TASK-71/101 doctrine): no catalog entry owed for test/fixture-teardown.mjs. All three catalog notes state their own scope as 'One bullet per test/*.test.mjs file' — verified at test-suite-catalog.md:33 — an explicit naming-convention boundary. The helper has no .test. in its name and contains zero test() calls; node --test collects it only as a phantom pass, which is the whole reason the suite total reads 627 rather than 626. It fails the catalogs' own stated inclusion test, so no bullet is owed and none was added. VERSION BUMP: verified not owed rather than assumed — check-version-bump exit=0, 'no released surface changed', matching the runbook's expectation for a test-only task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Teardown in the git-fixture suites no longer races git on .git removal: a shared removeFixtureDir() retries ENOTEMPTY/EBUSY/EPERM five times with escalating backoff and re-throws after the bound — bounded and loud, never silent, because swallowing would trade a visible flake for an invisible leak.

The fix is named as what it is (retry-with-backoff, AC#2), not a fixture redesign: these fixtures need real commits, branches and rev-parse output, so a fixture that left no live .git behind would gut what the tests prove. And force:true never covered this — per Node's docs it suppresses errors only for a path that no longer exists, doing nothing for a directory that is non-empty when rmdir fires.

MECHANISM: UNCONFIRMED, and recorded that way rather than dressed up (AC#1 asks for evidence). 1500+ iterations of the exact fixture-then-rmSync sequence on darwin produced zero reproductions; CI runs ubuntu-latest, a different kernel and filesystem. The helper is defensive against the class of hazard.

EVIDENCE: 20/20 consecutive green runs with raw per-run counts, reproduced independently by the orchestrator (AC#3). Stated honestly: 20 green runs on a platform that could never reproduce the bug BOUND the flake, they do not prove it fixed. The negative control broke the WINDOW logic at three points and flipped exactly the four window-consuming behaviours while the two that bypass it stayed green (AC#4) — proven non-inert by the before/after delta.

AUDIT (AC#5): sixteen files, sixteen verdicts, none skipped — 14 adopted (two deliberately partial, since converting a non-git fixture would be cargo-cult), 1 cleared with reason (run-gates has no teardown at all, so no removal can be raced).

Test-only: no version bump owed, verified at exit=0 rather than assumed. No catalog entry owed for the helper either, per the catalogs' own stated scope (one bullet per test/*.test.mjs). Three catalog notes re-pinned RE-PIN-ONLY after reading their diffs — imports and teardown only, no assertion touched.

Two items flagged rather than absorbed: run-gates.test.mjs leaks its temp dirs entirely (pre-existing, harmless in ephemeral CI), and removeFixtureDir's own retry contract stays unpinned because every available route was worse than no test — t.mock.module needs a flag 'node --test' does not pass, so such a test would pass locally and silently fail in CI.
<!-- SECTION:FINAL_SUMMARY:END -->
