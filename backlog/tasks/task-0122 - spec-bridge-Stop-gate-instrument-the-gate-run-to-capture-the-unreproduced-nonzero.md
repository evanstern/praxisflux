---
id: TASK-0122
title: >-
  spec-bridge Stop gate: instrument the gate run to capture the unreproduced
  nonzero
status: To Do
assignee: []
created_date: '2026-09-09 14:50'
updated_date: '2026-09-09 15:07'
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
As a future implementer, I want the spec-bridge Stop gate to log what its project-gate child process actually returned, so that the unreproduced nonzero `tests` exit can be diagnosed from evidence instead of guessed at from outside.

Follow-up to TASK-119 (Done), which collapsed the fan-out and labeled dirty-tree samples but left the root cause open. Its notes record SEVEN firings, one actionable, with every externally-reachable candidate ruled out (each with the command run): dirty tree, real failure, PATH/env in a minimal non-login shell, load-sensitive flake, gate timeout, SPEC_BRIDGE_GATE_ACTIVE=1 on the child, worktree cwd, and a faithful spawnSync replay of runGateCommand against both root and worktree. All returned exit 0.

TASK-119's own conclusion names the remaining route: "instrument the gate to log its captured stdout/stderr and exit code at Stop time, rather than trying to reproduce it from outside." The nonzero happens only in the harness's own Stop invocation and not in any invocation reachable from a shell.

Eighth firing observed 2026-09-09 (this session, read-only — no code changes in the tree), reporting `tests` red / exited 1 / 59 linked specs, while `node --test` at root exited 0 with 526/526 passing. Consistent with the known transient.

One hazard from TASK-119 Round 7 is now CLOSED, and should not be re-investigated as a cause: the orphaned `.claude/worktrees/refactor-triage-2026-07-31/` tree — unregistered, carrying its own `backlog/` and `docs/wiki/`, suite exiting 1 (254 tests, 1 fail), `.git` pointing at the nonexistent path `/Users/evanstern/neumo/projects/praxis` — was deleted 2026-09-09. If firings continue after that removal, the orphan tree was not the cause.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The gate logs its project-gate child's exit code, stdout and stderr at Stop time, to a durable location readable after the fact
- [ ] #2 The log records the resolved project root and cwd the gate sampled, so a root-vs-worktree mismatch is visible in evidence
- [ ] #3 A firing after instrumentation lands yields a captured artifact naming what the child actually returned — not a reasoned guess
- [ ] #4 Whether the orphan-tree removal (2026-09-09) ended the firings is recorded either way
- [ ] #5 The instrumentation cannot itself block Stop: a logging failure degrades to advisory, per the repo's advisory-local posture
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
