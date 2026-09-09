---
id: TASK-0122
title: 'gate-runner: an explicitly-passed cwd must win over ambient CLAUDE_PROJECT_DIR'
status: To Do
assignee: []
created_date: '2026-09-09 14:50'
updated_date: '2026-09-09 15:32'
labels:
  - tech-debt
  - spec-bridge
  - gates
dependencies:
  - TASK-119
priority: medium
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a gate author, I want `evaluate(input, gates, { cwd })` to honour the cwd I pass, so that an ambient `CLAUDE_PROJECT_DIR` in the environment cannot silently redirect a gate at a different project than the caller named.

ROOT CAUSE (found 2026-09-09, was the TASK-119 mystery — see that card's eight firings). `lib/gate-runner.mjs:39` resolves its start dir as:

    process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || cwd

The env var wins over BOTH `input.cwd` and the explicit `{ cwd }` option. So any in-process caller that passes a cwd is silently overridden whenever the variable is set — which the harness sets for every hook invocation.

WHY THIS IS THE REAL DEFECT, not the one test. Eight test files already hand-work around this by saving, deleting, and restoring the env var: install-path, spec-bridge, root-guard-hook, phase-status, pdlc, team-review, reorient, and board-provider-seam. Two of them carry comments naming the hazard verbatim ("evaluate() prefers it over the passed cwd"). Eight independent workarounds for one precedence rule is the smell; the next test to pass a cwd without knowing the folklore fails the same way, and only under the hook, where it is hardest to diagnose.

The precedence is also backwards on its merits: an argument a caller passes explicitly is more specific than an ambient environment variable, and the env var should be the FALLBACK for when no caller said otherwise — which is exactly what it is for in the real Stop-hook path, where nobody passes a cwd.

ALREADY DONE, do not redo (2026-09-09, commit 10ed971 on main):
- The immediate red was fixed by adding the save/delete/restore guard to the one failing test (`test/board-provider-seam.test.mjs`, the DoD #6 mirror test). Suite verified 526/526 exit 0 both with and without the env var set. That commit is test-only, so no version bump was owed.
- TASK-119's AC #4 is answered: the orphaned `.claude/worktrees/refactor-triage-2026-07-31` tree (deleted 2026-09-09) was NOT the cause — a firing came after its removal.
- The instrumentation the original version of this card asked for turned out to already ship: `SPEC_BRIDGE_GATE_TRACE` (bridge.mjs `tracePath()` — note the name, not `SPEC_BRIDGE_TRACE`). Its JSONL showed `['node','--test']` at status 1 while every sibling gate returned 0. No new logging is needed.

WHAT REMAINS is this card: change the precedence in `lib/gate-runner.mjs` so an explicit cwd wins, then retire the eight hand-rolled guards. This touches `lib/` — released surface — so it needs a marketplace version bump per docs/releasing.md, and it changes a contract other plugins' gates rest on, so it wants its own spec and a deliberate read of every call site rather than a quick edit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 evaluate() honours an explicitly-passed { cwd } over process.env.CLAUDE_PROJECT_DIR; the env var still wins over nothing-passed, so the real Stop-hook path is unchanged
- [ ] #2 input.cwd precedence versus the env var is decided deliberately and stated in the gate contract comment at the top of lib/gate-runner.mjs
- [ ] #3 Regression test: with CLAUDE_PROJECT_DIR set to a decoy dir, a gate given an explicit cwd resolves against the passed cwd, not the decoy
- [ ] #4 The eight test files carrying hand-rolled save/delete/restore guards are audited; guards made redundant by the fix are removed, and any kept are kept for a stated reason
- [ ] #5 Full suite passes BOTH ways — with CLAUDE_PROJECT_DIR set and unset — since only the former reproduces the original defect
- [ ] #6 Marketplace version bumped per docs/releasing.md (lib/ is released surface); docs/wiki re-pinned for every note sourcing lib/gate-runner.mjs
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ROOT CAUSE FOUND 2026-09-09 (ninth firing, this session). It is a TEST-ISOLATION defect, not a transient — which is why eight prior firings looked unreproducible from a shell.

MECHANISM (proven, not reasoned):
1. lib/gate-runner.mjs:39 resolves its root as `process.env.CLAUDE_PROJECT_DIR || input.cwd || cwd` — the ENV VAR WINS over the cwd a caller passes.
2. The harness's Stop invocation sets CLAUDE_PROJECT_DIR. That variable is inherited by the `node --test` child the gate spawns.
3. test/board-provider-seam.test.mjs:160 ('gate-runner: a malformed mirror's readMirror throw surfaces as a blocking problem, not a crash (DoD #6)') calls `evaluate({}, [bridgeGate], { cwd: p.root })` against a scratch fixture holding a deliberately malformed .board/links.json. With CLAUDE_PROJECT_DIR set, evaluate() ignores that cwd and samples the REAL repo instead — whose mirror is valid — so no crash occurs, the assertion on /crashed on .*malformed JSON/ fails, and the suite exits 1.
4. The gate reports 'tests red (exited 1)'. Running `node --test` from a shell has no CLAUDE_PROJECT_DIR set, so the same suite is 526/526 exit 0. Hence: red ONLY under the harness's own Stop invocation, green in every shell-reachable invocation — exactly the signature this card describes.

REPRODUCTION (one command, deterministic): `CLAUDE_PROJECT_DIR=$PWD node --test` → tests 526 / pass 525 / fail 1, naming that test. Without the var: 526/526.

EVIDENCE: captured via the EXISTING instrumentation this card asks for — SPEC_BRIDGE_GATE_TRACE (bridge.mjs tracePath(), note the name: not SPEC_BRIDGE_TRACE). The JSONL record for root=<worktree> showed command ['node','--test'] with status:1 while every sibling gate returned 0. So AC #1 and AC #2 are already satisfied by shipped code; what was missing was knowing the env var's name and filtering the trace, since the suite's own fixtures also write records to the same file.

FIX APPLIED (root checkout, main): added the CLAUDE_PROJECT_DIR save/delete/restore guard around that test, matching the guard test/reorient.test.mjs:190 already carries for this exact hazard ('evaluate() prefers it over the passed cwd'). Verified BOTH ways — with the var set: 526/526 exit 0; with it unset: 526/526 exit 0.

NOTE ON SCOPE: the fix repairs the one test's isolation. The deeper design question is untouched and worth its own decision — whether gate-runner.mjs should prefer an explicitly-passed cwd OVER the ambient env var, since today any in-process caller's cwd argument is silently overridden. Three call sites already work around it by hand (reorient.test.mjs, phase-status.test.mjs, and now this one), which is the smell.

AC #4: the orphan-tree removal did NOT end the firings — this ninth firing came after it. The orphan tree was not the cause, as this card anticipated.
<!-- SECTION:NOTES:END -->
