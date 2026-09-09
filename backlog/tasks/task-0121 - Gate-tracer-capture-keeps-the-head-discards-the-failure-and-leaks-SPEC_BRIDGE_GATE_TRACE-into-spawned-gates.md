---
id: TASK-0121
title: >-
  Gate tracer: capture keeps the head (discards the failure) and leaks
  SPEC_BRIDGE_GATE_TRACE into spawned gates
status: To Do
assignee: []
created_date: '2026-09-09 14:12'
labels:
  - tech-debt
  - spec-bridge
  - gates
dependencies: []
priority: high
ordinal: 152000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 capTrace preserves the END of a captured stream (tail, or head+tail with the middle elided) so a node --test failure summary survives the 4000-char cap
- [ ] #2 runGateCommand does not propagate SPEC_BRIDGE_GATE_TRACE to spawned gate children, so a traced gate run cannot hand tracing to the test suite it invokes
- [ ] #3 Regression test: a capped capture of output whose failure text is in the last 1000 chars still contains that text; and a spawned gate child's env lacks SPEC_BRIDGE_GATE_TRACE
<!-- AC:END -->
