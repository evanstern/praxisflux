---
id: TASK-0131
title: >-
  spec-bridge's project-gate runner captures its subprocess output then discards
  it — reports "is red (exited 1)" without the failure
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-11 16:05'
updated_date: '2026-09-14 19:25'
labels:
  - spec-bridge
  - gates
  - debt
  - diagnosability
dependencies: []
priority: high
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`runGateCommand` (`spec-bridge/gates/bridge.mjs`, ~lines 176-186) captures its subprocess's `stdout` and `stderr` into memory, and `collapsedGateProblems` then reports only:

    the required gate "tests" is red (exited 1) — 65 linked specs affected.

The actual failure is IN THE GATE'S HANDS at that moment and thrown away.

Field case, 2026-09-11, PR #144 (CI run 34616221159): the spec-bridge step failed with exactly that line. Diagnosing it needed a `gh run view --log` dig against a DIFFERENT run to recover the TAP output — which turned out to name the failing test, the file, the line, and the ENOENT path (now TASK-0130). All of that was captured and dropped.

WHY THIS MATTERS BEYOND CONVENIENCE: `docs/wiki/gates-convention.md` requires that a failure line NAME ITS FIX. "X is red" names neither the failure nor the fix — it is half a gate, and it is the same defect shape TASK-0125 was about: a gate whose output cannot be acted on. Spec 066 added a remedy line to `plant --check` for precisely this reason; this is the same omission one layer over.

It is also a cost lever. Recovering the output cost a full diagnostic subagent run (~160k tokens) for information the gate already had in a variable.

THE FIX: surface the subprocess's tail on failure — the last N lines of combined stdout/stderr, or the TAP `not ok` lines when the output is TAP. Keep it bounded so a 600-line suite dump does not drown the finding, and keep the existing one-line summary as the headline.

Scope note: `redByConstruction` gates are expected red and already reported differently; this is about `required` gates that fail.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A failing required project gate's finding includes a bounded excerpt of the subprocess's actual output (tail of combined stdout/stderr, or the TAP failure lines), not just the exit code
- [x] #2 The excerpt is length-capped so one failing suite cannot drown the finding or the surrounding findings
- [x] #3 The existing one-line summary survives as the headline — the excerpt is additional context, not a replacement
- [x] #4 Per gates-convention.md, the finding still names its fix alongside the excerpt
- [x] #5 A test proves the excerpt reaches the finding: a fixture gate that fails with known output, asserted to appear in checkBridge's problems
- [x] #6 redByConstruction gates keep their current reporting — they are expected red and this change does not touch that path
- [x] #7 Spec phase: Phase 1 — capture and bound the subprocess output (R1, R2, R3)
- [x] #8 Spec phase: Phase 2 — surface the excerpt in the finding (R4, R5, R7)
- [x] #9 Spec phase: Phase 3 — prove it, negative-controlled (R6, R7)
- [x] #10 Spec phase: Phase 4 — release obligations and re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Spec: specs/069-gate-failure-excerpt

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phase 1 — capture and bound; served verified from transcript, 141k tokens / 17 tool uses] served=claude-sonnet-5

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phase 2 — surface in the finding; served verified from transcript, 143k tokens / 21 tool uses] served=claude-sonnet-5

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phase 3 — tests, negative-controlled; served verified from transcript, 180k tokens / 45 tool uses] served=claude-sonnet-5

NEGATIVE CONTROLS REPRODUCED INDEPENDENTLY by the orchestrator, not taken from the dispatch's transcript. Broke boundOutput to a head-only slice(0,cap) and re-ran: exactly the tail-dependent assertions failed — the new '069 R3: a marker on the LAST line of long output survives the cap' plus TASK-0121's own two tail tests (R4 bounded-capture, 068 R1 capTrace tail) — while the other 40 stayed green, isolating the behaviour as intended. Restored and re-verified 630 pass / 0 fail with only test/project-gates.test.mjs modified. The dispatch also reported two further controls: excerptBlock forced to "" fails the three excerpt-reaching assertions but not the redByConstruction one (nothing to exclude), and appending the excerpt to redByConstruction fails ONLY the new real-subprocess R7 test — notably the pre-existing injected-fixture boundary test at project-gates.test.mjs:151 does NOT catch that regression, which is precisely the gap this phase closes.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] note=[Phase 4 — release and re-ground; served verified from transcript, 170k tokens / 60 tool uses] served=claude-sonnet-5
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A failing required project gate now reports the failure it already captured, instead of just its exit code.

runGateCommand held the subprocess's stdout/stderr and returned only 'exited N', which the finding rendered as 'is red (exited 1)'. Field case: PR #144 needed a gh run view --log dig against a DIFFERENT run plus a ~160k-token diagnostic subagent to recover facts the gate had in a local variable.

The fix carries a bounded 'output' on every non-green verdict and renders it as an indented block AFTER the existing headline, so scanning still reads gate -> reason -> count -> fix first. One shared bound, not two: capTrace's head+elision+tail shape was extracted so the excerpt reuses the tail-preserving rule rather than inventing a second one — load-bearing, because node --test prints its failure summary last. redByConstruction is byte-identical at both formatters.

Proven through the real chain (checkBridge with a real subprocess, not an injected run), negative-controlled, and the controls were reproduced independently by the orchestrator: forcing the bound head-only fails exactly the three tail-dependent assertions, 40 others green. Notable: the pre-existing injected-fixture boundary test does NOT catch an excerpt leaking into redByConstruction — only the new real-subprocess test does, which is the gap this closed.

Released 0.65.2; wiki re-pinned honestly across two passes (two NEEDS-REVIEW with prose amended first, fourteen RE-PIN-ONLY each verified against its own diff). Merged via PR #150 as a true merge commit.
<!-- SECTION:FINAL_SUMMARY:END -->
