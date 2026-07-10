---
id: TASK-9.4
title: 'Bridge gate: linked task status can''t exceed derived status (Stop hook)'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 02:26'
updated_date: '2026-07-10 03:06'
labels: []
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
priority: medium
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A gate in the gate-runner shape ({ name, resolveRoots, check, warn? }) wired as the plugin's Stop hook via lib/gate-runner.mjs. resolveRoots finds projects with both backlog/ and specs/; check re-runs the derivation for every linked task and reports a blocking problem when the task's Backlog status exceeds its derived status (e.g. marked Done while tasks.md has unchecked boxes). Optionally warn (non-blocking) when Backlog status LAGS derived state, nudging a sync. This is the praxis principle 'status can't exceed proven artifacts' applied to Spec Kit artifacts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Gate blocks the stop when any linked task's status exceeds its derived status, naming the task and the missing artifacts
- [x] #2 Gate resolves no roots (no-op) in projects without linked tasks
- [x] #3 Lagging-but-honest status produces at most a non-blocking warning
- [x] #4 Unit tests cover the gate via gate-runner's evaluate()
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Export bridgeGate ({name, resolveRoots via findRootsDownwards(hasChild('backlog')), check=problems from checkBridge, warn=lag warnings}) from gates/bridge.mjs (read-only, testable)
2. scripts/stop.mjs: runStopHook({gates:[bridgeGate]}); scripts/gate.sh: TASK-10-style node-resolving shim; hooks/hooks.json Stop wiring
3. Tests through gate-runner evaluate(): blocks on exceed naming task+artifacts, no-op without backlog/, lag -> warning not problem
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
bridgeGate exported from gates/bridge.mjs (gate-runner shape: resolveRoots=findRootsDownwards(hasChild('backlog')), check=exceeds problems, warn=lag notices); scripts/stop.mjs runs it on runStopHook; gate.sh is the TASK-10 node-resolving shim; hooks/hooks.json wires Stop. Tests go through gate-runner evaluate(): block on exceed (message names task + unchecked count), allow+warn on lag, no roots resolved without backlog/, stop_hook_active short-circuit. Live smoke: stop.mjs exit 0 on praxis (backlog/ present, no linked tasks). Suite green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the bridge Stop-hook gate: bridgeGate on lib/gate-runner (block when a linked task's status exceeds its derived status, warn when it lags, no-op outside bridged projects), wired via scripts/stop.mjs + gate.sh shim + hooks/hooks.json. Verified through evaluate() tests and a live no-op run.
<!-- SECTION:FINAL_SUMMARY:END -->
