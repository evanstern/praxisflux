---
id: TASK-0132
title: >-
  CI runs the full test suite twice per PR — the tests job, then again as
  spec-bridge's tests project gate
status: Done
assignee:
  - '@claude'
created_date: '2026-09-11 16:05'
updated_date: '2026-09-14 20:11'
labels:
  - ci
  - cost
  - debt
  - flake
dependencies: []
priority: medium
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.spec-bridge.json`'s `projectGates.required` includes `{ "name": "tests", "command": ["node","--test"] }`, so the `checks` job's spec-bridge step re-runs the ENTIRE suite that the separate `tests` job in the same CI run just finished. Two full runs per PR, ~14s each at 624 tests.

The cost is minor; the correctness consequence is not. **It is a second independent roll of the dice on any nondeterministic test.** That is exactly how the TASK-0130 flake (~5% per run) blocked PR #144: the `tests` job passed 624/624 while the `tests` project gate, rolling the same die again in the same run, came up red. A ~5% flake becomes ~10% per PR, and the failure surfaces in the *less* diagnosable of the two places (see TASK-0131).

WHY THE GATE ENTRY EXISTS AT ALL — do not just delete it: the `projectGates` mechanism enforces "a ticked tasks.md checkbox cannot outrun a red project gate", which is load-bearing doctrine and works correctly. The problem is the redundant INVOCATION in CI specifically, where a dedicated `tests` job already proves the same fact. Locally (Stop hook, pre-commit) there is no sibling job, so the gate entry is the only thing proving it — the fix must not disarm that.

Directions worth weighing, not a decided design:

- Have the CI spec-bridge step reuse the `tests` job's verdict rather than re-running (job dependency + status, or a marker the gate can read).
- Let `projectGates` entries declare that a gate is already satisfied by a sibling CI job, honored only when a CI env var is set.
- Order the jobs so a red `tests` short-circuits the `checks` job.

Whatever the shape: locally nothing may be weakened, and the doctrine the mechanism enforces must survive intact.

Related: TASK-0130 (the flake itself), TASK-0131 (the swallowed diagnostics that made this hard to see). Also worth noting CI has no retry and no flake quarantine, so any nondeterministic test blocks every PR at random — in scope to consider here, but only as it bears on the double-run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The full test suite runs ONCE per CI run, not twice — measured from the workflow logs, not assumed
- [x] #2 The 'a ticked checkbox cannot outrun a red project gate' enforcement still holds in CI: a genuinely red suite still fails the spec-bridge gate (proven by a deliberate red-suite run, not reasoned)
- [x] #3 Local invocation paths (Stop hook, pre-commit, hand-run) are UNCHANGED — there is no sibling job there, so the gate entry stays the only proof and nothing is weakened
- [x] #4 The chosen mechanism is data the host states in config, not behavior inferred from ambient env sniffing — consistent with how projectGates and statusVocabulary already work
- [x] #5 docs/consuming-gates.md (or the equivalent consumer contract doc) records the behavior change if the projectGates contract is extended
- [x] #6 Spec phase: Phase 1 — remove the redundant CI step (R1, R3, R4)
- [x] #7 Spec phase: Phase 2 — prove the enforcement survives in CI (R2)
- [x] #8 Spec phase: Phase 3 — re-ground and close (R5, R6)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Spec: specs/072-ci-double-run

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phases 1-2 — delete the redundant step, prove the gate blocks; served verified from transcript, 155k tokens / 34 tool uses] served=claude-sonnet-5

R2 PROOF STAGE 1 - LOCAL ONLY, labelled as the weaker evidence it is. A temporary failing test made the suite genuinely red (636 pass / 1 fail); running the exact invocation CI uses - node scripts/run-gates.mjs --gates spec-bridge --path . - then exited 1 and reported the tests gate as BLOCKING, naming it red with 71 linked specs affected and carrying the TAP tail. Fully reverted and verified independently by the orchestrator: no temp commit, stash empty, 636 pass / 0 fail, and no test-directory diff against main. WHY ONLY LOCAL HERE: ci.yml triggers on pull_request and push-to-main only (verified at lines 6-9), so a feature-branch push with no open PR never invokes the workflow. A real CI proof therefore needs the PR to exist - a sequencing fact, not an impossibility - so stage 2 completes R2 against the actual CI run instead of letting local evidence stand as final.

TRAP WORTH RECORDING, surfaced by the dispatch and not anticipated in the spec: isTreeDirty() in spec-bridge/gates/bridge.mjs demotes a red REQUIRED gate to a non-blocking WARNING when the working tree is dirty. So the naive local reproduction - add a failing test, run the gate on a dirty tree - prints GATE FAILED for some unrelated reason while the tests gate is merely warned about, and proves nothing about blocking. The stage-1 proof was deliberately run against a clean, committed red state to avoid exactly that. Anyone reproducing this must commit the red state first, or the demotion silently masks the result. This is a second instance of the sweep's recurring lesson: a gate reading green or red is only evidence if you know which tree and which range it evaluated.

PHASE 3 — AC#5 ADDRESSED EXPLICITLY, NOT SKIPPED: docs/consuming-gates.md needs no behavioural change, because AC#5 is conditional on the projectGates contract being extended and this direction extends nothing. The chosen mechanism is a workflow step deletion; .spec-bridge.json is byte-identical to main, the contract is untouched, and no consumer observes any difference. AC#6/R6 VERIFIED rather than assumed: test/run-gates.test.mjs passes UNMODIFIED (7 pass / 0 fail) and the branch has zero test-directory diff against main — confirming the finding that its drift check covers spec-bridge and wiki-freshness, not the tests step, so the blocker the runbook anticipated did not exist. VERSION BUMP: not owed, verified at exit=0 — .github/ is exempt released surface per check-version-bump's own rule. RE-PIN: docs/wiki/release-pipeline.md was NEEDS-REVIEW, not a pin bump - its CI section enumerated the steps starting with node --test and described install-path as also running inside the main node --test step. Both were falsified by this change, so prose was amended first (the step list, plus a paragraph stating why no standalone step exists and that the suite still gates once through the gate), THEN re-pinned. Left correct and untouched: the spec-057 paragraph (history, still true) and the release.yml reference at line 90, since release.yml genuinely still runs node --test - verified.

AC#1 MEASURED FROM THE WORKFLOW LOGS, not assumed, with a before/after on real runs. BEFORE (run 34890576521's predecessor - ci.yml on main at 12f55ab, run 34888040871): step 'tests' 19:37:41-19:37:49 (8s) AND step 'board is honest (spec-bridge)' 19:37:50-19:37:59 (9s) - two full suite executions, 17s of suite time. AFTER (run 34890576521 on this branch, ead5f7b): the checks job's step list contains NO tests step at all - marketplace catalog, versions consistent, plugins package, README/CLAUDE sync, board is honest (spec-bridge), grounding wiki fresh, planted block current, version bumped - and spec-bridge alone spans 20:03:21-20:03:31 (10s) while every sibling gate completes in under a second. The 10s IS the single suite run, executed inside the tests project gate. One run per CI run, halved from two, measured from the logs both sides.

R2 PROOF STAGE 2 - THE REAL CI RUN, which is what AC#2 asked for. Run 34890912169 on commit 23ab01f (a temporary deliberately-failing test pushed to this PR, then reverted). The checks job FAILED at step 'this repo board is honest (spec-bridge)', and the three steps after it were SKIPPED - so the gate did not merely report, it BLOCKED the run. Its output verbatim: 'GATE FAILED (1 issue(s)): the required gate tests is red (exited 1) - 71 linked specs affected. A ticked tasks.md checkbox cannot outrun a red project gate - make the gate pass or set the box back.' followed by the excerpt block naming 'not ok 1 - spec 072 R2 proof', the failureType, and the file and line at test/_r2-ci-proof.test.mjs:8. THAT EXCERPT IS TASK-0131's WORK, merged earlier in this same sweep: before it, this exact failure would have read only 'is red (exited 1)' with no test name, no file, no line. So this one CI log is simultaneously the proof for this card and a field demonstration of the sibling card's value. Reverted: red test removed, 636 pass / 0 fail restored.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
CI now runs the test suite once per run instead of twice.

ci.yml's standalone `- name: tests` step is removed; spec-bridge's `tests` project gate — which already ran the whole suite — is now the single invocation. The gate entry deliberately stays: it enforces "a ticked tasks.md checkbox cannot outrun a red project gate", which is doctrine that works. The defect was the redundant invocation in CI, not the mechanism.

WHY IT MATTERED: the double-run was a second independent roll of the dice on any nondeterministic test, so a ~5% flake became ~10% per PR. That is exactly how the TASK-0130 flake blocked PR #144, with the dedicated step passing 624/624 while the gate rolled the same die again and came up red.

AC#1, MEASURED FROM THE LOGS both sides rather than inferred from the file: before (run 34888040871) the tests step took 8s AND spec-bridge 9s — two executions; after (run 34890576521) there is no tests step in the job's step list and spec-bridge alone takes 10s while every sibling gate finishes under a second.

AC#2, PROVEN BY A REAL RED-SUITE CI RUN (34890912169), not argued: the checks job failed at the spec-bridge step and the three steps after it were skipped — the gate blocked, it did not merely report. This mattered because after the deletion that gate is the only thing in CI between a red suite and a green run, so a green run would have proven nothing.

A NOTE ON THE PROOF ITSELF: the gate's output named the failing test, its file and its line — TASK-0131's excerpt, merged earlier in this same sweep. Before that card, this exact failure read "is red (exited 1)" and nothing more. One CI log proves this card and demonstrates the sibling's value in the field.

TWO PREMISE CORRECTIONS, both verified at HEAD and written into the spec. (1) The card said "the tests job, then again as spec-bridge's gate" — there is no second job; ci.yml has only checks and install-path, and both invocations were steps inside checks, which is why two of the three offered directions had no job boundary to attach to. (2) The runbook warned test/run-gates.test.mjs asserts both CI steps stay present and would need careful updating — it does not; it covers spec-bridge and wiki-freshness, never node --test, and passes unmodified with zero test-directory diff.

AC#4 satisfied by construction (no new config key, nothing sniffs the environment). AC#5 answered rather than skipped: docs/consuming-gates.md needs no change because AC#5 is conditional on extending the projectGates contract, and a step deletion extends nothing. AC#3 verified by diff: no local path changed — and the pre-commit hook refusing to commit the red suite was incidental proof of it.

No version bump owed (.github/ is exempt, verified at exit 0). One re-pin, NEEDS-REVIEW not a bump: docs/wiki/release-pipeline.md enumerated CI's steps opening with node --test and described install-path's file as running inside "the main node --test step" — both falsified, so prose was amended first. Two other node --test references in that note were read and left: one is spec-057 history, the other belongs to release.yml, which genuinely still runs it.

A TRAP RECORDED FOR REUSE: isTreeDirty() demotes a red required gate to a non-blocking warning on a dirty tree, so a naive local reproduction proves nothing. The local stage-1 proof was run against a committed red state for that reason.
<!-- SECTION:FINAL_SUMMARY:END -->
