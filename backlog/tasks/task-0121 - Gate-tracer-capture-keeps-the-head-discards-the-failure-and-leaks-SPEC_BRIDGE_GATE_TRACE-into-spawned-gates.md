---
id: TASK-0121
title: >-
  Gate tracer: capture keeps the head (discards the failure) and leaks
  SPEC_BRIDGE_GATE_TRACE into spawned gates
status: To Do
assignee: []
created_date: '2026-09-09 14:12'
updated_date: '2026-09-09 14:13'
labels:
  - tech-debt
  - spec-bridge
  - gates
dependencies: []
priority: high
ordinal: 152000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in execution 2026-09-09, round 16 of the TASK-119 gate firings — by the R4 tracer TASK-119 shipped, on its first real capture.

Context: the spec-bridge Stop gate had fired sixteen times with a red `tests` verdict that no shell invocation could reproduce. TASK-119 shipped opt-in tracing (SPEC_BRIDGE_GATE_TRACE) precisely so the next firing could be read from inside the hook. It worked — the record showed root = the repo root, roots = exactly ONE, and `node --test` => status 1, signal null, error none. That is a genuine test failure, which eliminated both standing hypotheses (TASK-10's node-PATH gap, which would surface as ENOENT, and the orphan-tree multi-root theory).

But the same record exposed two defects in the instrumentation itself.

DEFECT A — the capture keeps the HEAD, so it discards the answer.
capTrace() slices the FIRST 4000 chars and appends a truncation marker. The captured record ended with "...[59774 more bytes truncated]". `node --test` prints its failure summary and the failing-test block at the END of its output, so the one record that finally caught a red threw away the part naming which test failed. The 4000-char cap is correct and worth keeping — a full suite's output is ~64KB — but the diagnostic half is the tail, not the head.

Fix: keep the tail, or keep head+tail and elide the middle. The marker should say which part was dropped.

DEFECT B — the env var leaks into spawned gates, and the suite traces itself.
Of 50 records in the trace file, 49 had roots pointing at the TEST SUITE'S OWN temp fixtures (/var/folders/.../spec-bridge-bP1dLn, phase-status-proj-...) with commands:[]. Those are the suite's own bridgeGate/checkBridge calls writing trace records: SPEC_BRIDGE_GATE_TRACE is set in the operator's session env, `node --test` inherits it, and every in-suite bridge call then appends to the operator's trace file. Only ONE of the 50 records was a real gate invocation.

This is worse than noise. The gate spawns `node --test` with its own env (runGateCommand deliberately sets SPEC_BRIDGE_GATE_ACTIVE on the child), so a traced gate run hands tracing to the suite it invokes — the diagnostic artifact is contaminated by the thing being diagnosed, and the trace file fills with fixture records that bury the one useful row. It is also a plausible contributor to the intermittent red itself: the suite's assertions were written assuming tracing is off. R4's own "default path writes nothing" test explicitly deletes the var, but the other bridgeGate-touching tests do not.

Fix: strip SPEC_BRIDGE_GATE_TRACE from the child env in runGateCommand, the same place SPEC_BRIDGE_GATE_ACTIVE is set. A gate's child should never inherit tracing.

Evidence and limits: the red remains INTERMITTENT and was not reproduced from a shell even with the hook's exact environment — SPEC_BRIDGE_GATE_TRACE plus SPEC_BRIDGE_GATE_ACTIVE set, the hook's actual node (homebrew v26.3.1, which the shim's login-shell fallback resolves rather than the shell's volta v24.17.0), run from the repo root: 526/526 exit 0, four consecutive times. So this card does not claim to fix the red. It fixes the two reasons we still cannot READ which test failed when it happens — which is the prerequisite for fixing it.

Both defects are in code TASK-119 merged (spec 061 R4), so this is that task's own residue rather than pre-existing debt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 capTrace preserves the END of a captured stream (tail, or head+tail with the middle elided) so a node --test failure summary survives the 4000-char cap
- [ ] #2 runGateCommand does not propagate SPEC_BRIDGE_GATE_TRACE to spawned gate children, so a traced gate run cannot hand tracing to the test suite it invokes
- [ ] #3 Regression test: a capped capture of output whose failure text is in the last 1000 chars still contains that text; and a spawned gate child's env lacks SPEC_BRIDGE_GATE_TRACE
<!-- AC:END -->
