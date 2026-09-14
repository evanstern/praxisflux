---
id: TASK-0121
title: >-
  Gate tracer: capture keeps the head (discards the failure) and leaks
  SPEC_BRIDGE_GATE_TRACE into spawned gates
status: Done
assignee:
  - '@claude'
created_date: '2026-09-09 14:12'
updated_date: '2026-09-14 15:28'
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

Context: the spec-bridge Stop gate had fired sixteen times with a red `tests` verdict that no shell invocation could reproduce. TASK-119 shipped opt-in tracing (SPEC_BRIDGE_GATE_TRACE) precisely so the next firing could be read from inside the hook. It worked — the record showed root = the repo root, roots = exactly ONE, and `node --test` => status 1, signal null, error none. That is a genuine test failure, which eliminated both standing hypotheses (TASK-10s node-PATH gap, which would surface as ENOENT, and the orphan-tree multi-root theory).

But the same record exposed two defects in the instrumentation itself.

DEFECT A — the capture keeps the HEAD, so it discards the answer.
capTrace() slices the FIRST 4000 chars and appends a truncation marker. The captured record ended with "...[59774 more bytes truncated]". `node --test` prints its failure summary and the failing-test block at the END of its output, so the one record that finally caught a red threw away the part naming which test failed. The 4000-char cap is correct and worth keeping — a full suites output is ~64KB — but the diagnostic half is the tail, not the head.

Fix: keep the tail, or keep head+tail and elide the middle. The marker should say which part was dropped.

DEFECT B — the env var leaks into spawned gates, and the suite traces itself.
Of 50 records in the trace file, 49 had roots pointing at the TEST SUITEs OWN temp fixtures (/var/folders/.../spec-bridge-bP1dLn, phase-status-proj-...) with commands:[]. Those are the suites own bridgeGate/checkBridge calls writing trace records: SPEC_BRIDGE_GATE_TRACE is set in the operators session env, `node --test` inherits it, and every in-suite bridge call then appends to the operators trace file. Only ONE of the 50 records was a real gate invocation.

This is worse than noise. The gate spawns `node --test` with its own env (runGateCommand deliberately sets SPEC_BRIDGE_GATE_ACTIVE on the child), so a traced gate run hands tracing to the suite it invokes — the diagnostic artifact is contaminated by the thing being diagnosed, and the trace file fills with fixture records that bury the one useful row. It is also a plausible contributor to the intermittent red itself: the suites assertions were written assuming tracing is off. R4s own "default path writes nothing" test explicitly deletes the var, but the other bridgeGate-touching tests do not.

Fix: strip SPEC_BRIDGE_GATE_TRACE from the child env in runGateCommand, the same place SPEC_BRIDGE_GATE_ACTIVE is set. A gates child should never inherit tracing.

Evidence and limits: the red remains INTERMITTENT and was not reproduced from a shell even with the hooks exact environment — SPEC_BRIDGE_GATE_TRACE plus SPEC_BRIDGE_GATE_ACTIVE set, the hooks actual node (homebrew v26.3.1, which the shims login-shell fallback resolves rather than the shells volta v24.17.0), run from the repo root: 526/526 exit 0, four consecutive times. So this card does not claim to fix the red. It fixes the two reasons we still cannot READ which test failed when it happens — which is the prerequisite for fixing it.

Both defects are in code TASK-119 merged (spec 061 R4), so this is that tasks own residue rather than pre-existing debt.

Spec: specs/068-gate-tracer-capture
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 capTrace preserves the END of a captured stream (tail, or head+tail with the middle elided) so a node --test failure summary survives the 4000-char cap
- [x] #2 runGateCommand does not propagate SPEC_BRIDGE_GATE_TRACE to spawned gate children, so a traced gate run cannot hand tracing to the test suite it invokes
- [x] #3 Regression test: a capped capture of output whose failure text is in the last 1000 chars still contains that text; and a spawned gate child's env lacks SPEC_BRIDGE_GATE_TRACE
- [x] #4 Spec phase: Phase 1 — capTrace preserves the tail (R1)
- [x] #5 Spec phase: Phase 2 — child env drops the trace var (R2)
- [x] #6 Spec phase: Phase 3 — regression tests, negative-controlled (R3)
- [ ] #7 Spec phase: Phase 4 — release obligations and re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5

Phase 1 (R1 — capTrace preserves the tail) complete, commit 413e9bd.

SERVED-MODEL VERIFICATION (the reason TASK-0121 ran first as this sweep calibration):
the dispatch transcript reports served model `claude-sonnet-5`, NOT the orchestrator
session model (Opus 5). The tier pin therefore works on this host through the generated
agent definition at .claude/agents/sonnet-implementer.md. This is the load-bearing check
the sweep doctrine requires before launching sibling dispatches — a wrong pin caught
after one agent is a rounding error; caught after a lane, it is the lane budget. Sibling
dispatches are now cleared to launch at this tier.

Implementation verified rather than accepted on report: head 800 + marker 19 + tail 3181
= exactly 4000, so TRACE_CAP is a total and was not silently doubled (the specific failure
plan.md step 1.1 warned against). Tail gets ~4x the head, per the plan. node --test 624
pass / 0 fail.

SCOPE NOTE — one file outside the dispatch was touched, flagged by the implementer rather
than hidden: test/project-gates.test.mjs:594, a spec-061 assertion matching the old marker
text /truncated/, updated to /elided middle/. Reviewed and accepted: it is a one-line
assertion repair required by the marker change, not new Phase 3 coverage, and the adjacent
cap assertion at :593 still pins that the stream is bounded.

Observation for Phase 3: that adjacent assertion is `stdout.length < 10000` against a
TRACE_CAP of 4000 — it would pass at 9999 chars. Pre-existing weakness, not introduced
here, but exactly the shape TASK-118 (assertions weaker than their stated intent) is
carded for. Phase 3 should pin the real bound.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5

Phase 2 (R2 — child env drops SPEC_BRIDGE_GATE_TRACE) complete, commit 7e70e57.
Served model re-verified from the transcript: claude-sonnet-5. Tier pin holding.

Verified rather than accepted on report: the strip is `delete childEnv.SPEC_BRIDGE_GATE_TRACE`
on a fresh spread copy, so the variable is truly ABSENT (not "" and not "0", either of which
tracePath() would still read as on since it treats any truthy value as an on-switch), while
SPEC_BRIDGE_GATE_ACTIVE: "1" is still set on the child. process.env is never dereferenced
after the spread, so the parent session keeps its tracing for the rest of the Stop invocation
— plan.md step 2.3, which mattered because mutating the parent would have silently disarmed
the very run being diagnosed.

THE EXPECTED HAZARD DID NOT MATERIALIZE: plan.md Risks warned that a test might be passing
BECAUSE it inherits the leak, which would surface here as a new failure. None did — 624 pass
/ 0 fail, identical to the Phase 1 baseline. So no suite assertion depended on inherited
tracing. Recording the negative result because the risk was recorded up front; it is evidence
about the suite, not an absence of news.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=claude-sonnet-5

Phase 3 (R3 — regression tests, negative-controlled) complete, commit 28cd564. Served model re-verified from the transcript: claude-sonnet-5. Three for three on the tier pin.

Suite: 626 pass / 0 fail on an INDEPENDENT orchestrator run — not just the implementer report and not just the pre-commit hook. Baseline 624 plus the two new tests. Both fixes verified still present in source after the negative-control reverts: capTrace head+tail at bridge.mjs:279-285, and the childEnv delete of the trace var at :183. A diff of bridge.mjs between 7e70e57 and HEAD is empty, so Phase 3 restored the code exactly rather than leaving a revert behind. Working tree clean.

NEGATIVE CONTROLS CARRIED REAL EVIDENCE, the bar spec R3 set. Each revert produced a NAMED failure, not merely "it failed":
- R1 control (capTrace reverted to the head-only slice): the tail test failed expected true / actual false (marker gone), AND the tightened cap test failed expected 4000 / actual 4028. The old marker format being longer is independent corroboration that the revert genuinely took effect.
- R2 control (delete line removed): the env test failed expected true / actual false, the var present on the child env.
Both restored, each confirmed by an empty diff against the fix. This is the standard TASK-118 exists to generalize: a control that silently no-ops looks identical to a real pass, and the 4028 figure is what proves this one did not no-op.

ALSO FIXED (in scope, one line): test/project-gates.test.mjs:595, the spec-061 assertion stdout.length < 10000 against a TRACE_CAP of 4000 — it would have passed at 9,999 chars. Now assert.equal(..., 4000), pinning the real bound. Found by the orchestrator while reviewing Phase 1; it is the TASK-118 defect shape sitting in the file Phase 3 was already editing. Scoped to that single assertion — TASK-118 itself remains unstarted and out of this sweep run.

TRAILER MISATTRIBUTION — orchestrator error, to state plainly at PR time. All three phase commits carry the Opus 5 co-author trailer because the dispatch prompts specified it verbatim, but the work was served by claude-sonnet-5. The Phase 3 implementer flagged the mismatch rather than following it silently. The trailer is this repos configured session attribution, so it is not wrong in the harness sense, but it does misdescribe which model wrote the code. The Dispatch: lines on this card are the accurate record; the PR body will say so.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Phase 1 — capTrace preserves the tail (R1): 4/4 · Phase 2 — child env drops the trace var (R2): 3/3 · Phase 3 — regression tests, negative-controlled (R3): 4/4 · Phase 4 — release obligations and re-ground: 4/4). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
