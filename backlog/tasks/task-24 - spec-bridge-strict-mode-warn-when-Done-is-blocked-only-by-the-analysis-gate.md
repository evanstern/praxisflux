---
id: TASK-24
title: 'spec-bridge strict mode: warn when Done is blocked only by the analysis gate'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-11 01:36'
updated_date: '2026-07-11 04:36'
labels: []
dependencies: []
priority: low
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spun off from TASK-9.8 (parent TASK-9 closed 2026-07-10; subtask archived) — first-spin finding. With strictDone on, a linked task honestly In Progress with every checkbox checked but a missing analysis.md (or unresolved CRITICAL findings) sits in a silent state — Done is out of reach and nothing says so until someone runs 'cli.mjs state'. Surface it: when a linked task's ONLY shortfall from Done-eligible is the analysis requirement, checkBridge should emit a non-blocking lag-style warning naming the reason ('all tasks checked; Done blocked by strict mode: analysis.md missing' / '...unresolved CRITICAL: <finding>'), shown via gate-runner's warn channel. Never a blocking problem — the status is honest.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 strictDone + all boxes checked + missing analysis.md -> non-blocking warning naming the missing report
- [x] #2 strictDone + all boxes checked + unresolved CRITICAL -> non-blocking warning naming the finding
- [x] #3 No such warning in checkbox-only mode, or while tasks.md still has unchecked tasks
- [x] #4 Tests through gate-runner evaluate() assert these surface as warnings, never problems
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. checkBridge (spec-bridge/gates/bridge.mjs): after the verdict, when verdict is 'ok' AND strict mode is on AND spec.md+plan.md present AND all tasks checked AND Done-eligible is blocked ONLY by the analysis requirement -> push a non-blocking lag-style warning naming the exact reason (analysis.md missing w/ the save-the-report fix, or the unresolved CRITICAL findings verbatim). Never a problem — the status is honest.
2. Tests through gate-runner evaluate(): missing-analysis warning, CRITICAL warning (naming the finding), silence in checkbox-only mode, silence while tasks remain unchecked, and warnings-never-problems.
3. Bump marketplace 0.6.5; wiki plan/repin cadence; per-task course docs/courses/TASK-24; finalize + PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shipped: checkBridge near-miss warning (six-condition guard: honest verdict + strict mode + all boxes + plan.md present + not Done-eligible => the analysis requirement is provably the only blocker). Warn channel only. Tests through gate-runner evaluate(): missing-report, CRITICAL-named-verbatim, resolved-CRITICAL handoff to ordinary lag, checkbox-only silence, unchecked-tasks silence. Suite 112. Marketplace 0.6.5. Wiki pass also pulled the TASK-21 style lever: six plugin notes dropped lockstep numerals — future stamp bumps auto-RE-PIN them. Course docs/courses/TASK-24 (2 modules, coral) gate-passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
strictDone's silent near-miss state is gone: when a linked task is honest, every checkbox is checked, plan.md exists, and ONLY the analysis requirement blocks Done-eligible, checkBridge emits a lag-style warning on the warn channel naming the missing analysis.md (with the save-the-report fix) or the unresolved CRITICAL findings verbatim — never a blocking problem, the status is honest. Covered end-to-end through gate-runner evaluate() incl. silence in checkbox-only mode and while tasks remain unchecked. Marketplace 0.6.5; wiki re-verified (8 notes, plus the literal-free lockstep prose change that makes future stamp bumps auto-RE-PIN six notes); per-task course at docs/courses/TASK-24.
<!-- SECTION:FINAL_SUMMARY:END -->
