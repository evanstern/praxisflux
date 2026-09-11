---
id: TASK-0131
title: >-
  spec-bridge's project-gate runner captures its subprocess output then discards
  it — reports "is red (exited 1)" without the failure
status: To Do
assignee: []
created_date: '2026-09-11 16:05'
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
- [ ] #1 A failing required project gate's finding includes a bounded excerpt of the subprocess's actual output (tail of combined stdout/stderr, or the TAP failure lines), not just the exit code
- [ ] #2 The excerpt is length-capped so one failing suite cannot drown the finding or the surrounding findings
- [ ] #3 The existing one-line summary survives as the headline — the excerpt is additional context, not a replacement
- [ ] #4 Per gates-convention.md, the finding still names its fix alongside the excerpt
- [ ] #5 A test proves the excerpt reaches the finding: a fixture gate that fails with known output, asserted to appear in checkBridge's problems
- [ ] #6 redByConstruction gates keep their current reporting — they are expected red and this change does not touch that path
<!-- AC:END -->
