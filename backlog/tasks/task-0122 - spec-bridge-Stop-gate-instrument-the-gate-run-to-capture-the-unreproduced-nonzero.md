---
id: TASK-0122
title: 'gate-runner: an explicitly-passed cwd must win over ambient CLAUDE_PROJECT_DIR'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-09 14:50'
updated_date: '2026-09-09 16:28'
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

WHAT REMAINS is this card: change the precedence in `lib/gate-runner.mjs` so an explicit cwd wins, then retire the eight hand-rolled guards. This touches `lib/` — released surface, vendored into NINE plugins by scripts/sync-shared.mjs — so it needs a marketplace version bump per docs/releasing.md and a docs/wiki re-pin.

CLAIMED into the sweep as Lane 2.5 (operator ruling 2026-09-09): it runs BEFORE TASK-112/113 because every remaining phase of those dispatches under the Stop hook this defect makes falsely red. Verified while specifying: the only production caller of evaluate() is runStopHook (lib/gate-runner.mjs:77), which passes NO cwd — so the real hook path lands in the unchanged branch of the precedence by construction, and every caller that does pass a cwd is a test that already deletes the env var to get the new behaviour.

Spec: specs/062-gate-runner-cwd
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 evaluate() honours an explicitly-passed { cwd } over process.env.CLAUDE_PROJECT_DIR; the env var still wins over nothing-passed, so the real Stop-hook path is unchanged
- [x] #2 input.cwd precedence versus the env var is decided deliberately and stated in the gate contract comment at the top of lib/gate-runner.mjs
- [x] #3 Regression test: with CLAUDE_PROJECT_DIR set to a decoy dir, a gate given an explicit cwd resolves against the passed cwd, not the decoy
- [x] #4 The eight test files carrying hand-rolled save/delete/restore guards are audited; guards made redundant by the fix are removed, and any kept are kept for a stated reason
- [x] #5 Full suite passes BOTH ways — with CLAUDE_PROJECT_DIR set and unset — since only the former reproduces the original defect
- [ ] #6 Marketplace version bumped per docs/releasing.md (lib/ is released surface); docs/wiki re-pinned for every note sourcing lib/gate-runner.mjs
- [x] #7 Spec phase: Phase 1 — The decoy regression test, captured RED first
- [x] #8 Spec phase: Phase 2 — The precedence change
- [x] #9 Spec phase: Phase 3 — Audit the eight hand-rolled guards
- [ ] #10 Spec phase: Phase 4 — Release obligations and re-ground
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

SWEEP CLAIM 2026-09-09 (Lane 2.5, inserted by operator ruling — runs BEFORE TASK-112/113 because every remaining phase of those dispatches under the Stop hook this defect makes falsely red). Claimed atomically at c900820 on branch task-0122-gate-runner-cwd: status flip + specs/062-gate-runner-cwd/{spec,plan,tasks}.md + Spec marker in one commit, pushed.

Tier: sonnet / cc/claude-sonnet-5[1m] (defaultTier per .claude/model-tiers.json; tiers.mjs --check exit 0, all three unchanged). No escalation. Justification: the spec settles the judgment calls — the precedence order and its rationale are decided in plan.md, so the implementer is working to a written spec. Served model to be verified from the first dispatch's transcript before any sibling dispatch.

TWO THINGS VERIFIED WHILE SPECIFYING, both narrowing the risk:
1. The ONLY production caller of evaluate() is runStopHook (lib/gate-runner.mjs:77) and it passes NO cwd — so the real Stop-hook path lands in the unchanged branch of the new precedence by construction. Every caller that DOES pass a cwd is a test, and all eight already delete the env var to get the behaviour this change makes the default. The fix moves the code toward what every caller already wants.
2. lib/gate-runner.mjs is vendored into NINE plugins by scripts/sync-shared.mjs (build, codebase-to-course, educate, grounding-wiki, pdlc, reorient, research, spec-bridge, team-review) and ~10 wiki notes source it. AC#6's bump + re-pin are real obligations.

PRECEDENCE DECIDED (AC#2, recorded in plan.md so the implementer does not re-litigate it): explicit { cwd } > CLAUDE_PROJECT_DIR > input.cwd > process.cwd(). Rationale: an explicit argument is a caller naming a directory on purpose and must never be silently overridden; the env var is the harness's authoritative statement of the project root and stays ahead of input.cwd, because input.cwd is merely where the hook happened to fire (a worktree, a subdir) while the env var names the project. Nothing-passed behaviour is byte-identical to today. Mechanical note for the implementer: the signature must distinguish 'no cwd passed' from a passed value, so default the option to undefined and fall back inside the expression — today's { cwd = process.cwd() } erases that distinction, which is why the bug was possible at all.

TWO CORRECTIONS TO MY OWN EARLIER CLAIMS (both were wrong; recorded so neither is re-acted-on):
- I said THREE test files hand-work around this precedence. Correct count is EIGHT, verified by grep. The other session's number was right and mine was wrong.
- I briefly concluded backlog's new zero_padded_ids: 4 made TASK-0121/0122 invisible to the bridge. FALSE. parseLinkedTask reads id: from frontmatter and is format-agnostic; called directly it returns TASK-0122 with all 10 ACs. The real reason 'cli.mjs links' omits the card is that checkBridge reads the COMMITTED .board/links.json mirror — a 61-link snapshot predating both cards. The live gate is unaffected (exit 0) because the backlog provider is requiresSync:false, so live projection wins over the stale mirror. Worth knowing separately: the committed mirror in this repo is stale by two cards.

PHASES 1-2 DONE AND ORCHESTRATOR-VERIFIED (2026-09-09, branch task-0122-gate-runner-cwd).

Phase 1 (3203b5e) — the decoy regression test, captured RED on purpose. Verified independently, not on report: lib/ confirmed untouched (git diff origin/main...HEAD -- lib/ empty), and the RED reproduces at 527 tests / 526 pass / 1 fail with that one failure being the precedence assertion itself ('must resolve against the passed fixture, not $CLAUDE_PROJECT_DIR's decoy'). Committed --no-verify, disclosed in the message body — correct, since the pre-commit hook would rightly block a deliberate RED. The test is stronger than the pre-existing DoD#6 guard: it sets the env var to a POPULATED decoy whose content yields a different verdict, rather than merely deleting the var.

Phase 2 (020db3b) — the precedence change. Committed content verified via git show:
  export function evaluate(input, gates, { cwd = undefined } = {}) {
    const start = cwd || process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
Both halves present: the corrected order AND the undefined default that makes 'no cwd passed' distinguishable from a passed value — the mechanical reason the bug was possible at all (the old { cwd = process.cwd() } destructuring default erased that distinction). The contract comment states the four-step order and its rationale, including why the env var still outranks input.cwd.

Suite verified by the orchestrator, both ways, bare node --test: CLAUDE_PROJECT_DIR SET → 527/527 exit 0; UNSET → 527/527 exit 0. Previously the SET case was 526/1.

R2 proven directly, not argued: with nothing passed, evaluate() still resolves the env var over input.cwd (probe with CLAUDE_PROJECT_DIR=/tmp/env-wins and input.cwd=/tmp/input-cwd resolved /tmp/env-wins). The real Stop-hook path is byte-identical, as runStopHook passes no cwd.

THE ORIGINAL SYMPTOM IS GONE: the spec-bridge Stop gate run from this worktree no longer reports 'tests red'. What it now reports is 'wiki-freshness' red — which is Phase 4's own obligation (the version bump has not happened yet), not a regression.

Served model VERIFIED for both dispatches: claude-sonnet-5, read from the transcripts' per-request records rather than agent self-report (34 requests on Phase 1). Tier held at sonnet / cc/claude-sonnet-5[1m]; no escalation. Cost so far: ~136k + ~138k subagent tokens.

ACs ticked on verified evidence only: #1, #2, #3 (and phases #7, #8). AC#5 deliberately left unticked until Phase 3's guard audit lands, because that phase can still move the suite.

PHASE 3 DONE AND VERIFIED (a590d4b). The eight-file guard audit came back 9 KEEP / 5 REMOVE, and the classification is correct on inspection — I checked the removals rather than trusting the pass.

Every REMOVE site was confirmed to already pass an explicit { cwd } to evaluate(), which the Phase 2 fix now honours: team-review's stop-hook test (1) and reorient's three guards (3) and board-provider-seam's DoD#6 guard (1). The KEEPs are load-bearing for two distinct reasons, both real: SUBPROCESS tests (install-path, root-guard-hook, team-review's cli() sites) whose children inherit the ambient env no matter what the parent argument said, and IN-PROCESS calls that pass only input.cwd and no explicit { cwd } option (spec-bridge's and phase-status's evalAt) — input.cwd sits BELOW the env var in the new precedence, so pinning is still required there. Every KEEP carries a stated reason, per AC#4.

Two findings from the audit worth recording:
1. test/pdlc.test.mjs was NOT actually one of the eight. Its only CLAUDE_PROJECT_DIR match is a doc comment about hook wiring — no env manipulation exists there to classify. So the real count of files carrying guards is SEVEN, not eight. Both the other session's count and mine were derived from a filename grep that caught a comment. The defect's severity is unchanged; the census was off by one.
2. The protected files (spec-bridge, phase-status) each gained 3 lines — COMMENT ONLY, no test logic touched. Checked whether this violates their protection: there is no mechanical hash/byte assertion anywhere in the suite; 'byte-faithful' in board-provider-seam:208 refers to the exact COMMAND STRINGS those tests assert, which comment additions preserve. The agent's conservative KEEP-with-comment call in those files was right.

Suite verified by the orchestrator after the audit, both ways, bare node --test: SET → 527/527 exit 0; UNSET → 527/527 exit 0. AC#5 now earned and ticked (it was deliberately held back through Phases 1-2 because a guard audit can move the suite).

Remaining: AC#6 only — Phase 4's release obligations (version bump, re-sync the nine vendored lib/gate-runner.mjs copies, re-pin the wiki notes sourcing it).
<!-- SECTION:NOTES:END -->
