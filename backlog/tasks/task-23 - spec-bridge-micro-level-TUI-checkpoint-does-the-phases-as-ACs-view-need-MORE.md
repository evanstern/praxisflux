---
id: TASK-23
title: 'spec-bridge micro-level TUI checkpoint: does the phases-as-ACs view need MORE'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-11 01:36'
updated_date: '2026-07-11 04:46'
labels: []
dependencies: []
priority: low
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spun off from TASK-9.6 (parent TASK-9 closed 2026-07-10; subtask archived) — deliberately deferred decision checkpoint. After living with sync + phases-as-ACs on a real spec, evaluate whether a richer live view of Spec Kit micro progress is wanted (e.g. a small renderer over tasks.md showing individual T-task flips in real time, or deeper Backlog board integration). The user has stated a general appetite for MORE; this task decides what MORE means with usage experience in hand. Outcome may be: do nothing, small tasks.md watcher/renderer, or a follow-up epic. Carried context from the first real spin (2026-07-09): the bridge held end to end; friction item (1) from that spin — mechanical sync — has since shipped as the plan command (TASK-9.7); item (2) — silent strict-mode block — is the spun-off warning task; phase names with parentheses round-tripped fine.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Decision recorded (in this task's notes) on whether/what to build, based on actual usage of the bridge
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (user-confirmed 2026-07-11): DO NOTHING FURTHER. The checkpoint's question — does phases-as-ACs need a richer live micro view? — was answered sideways by usage: (1) the mechanical-sync friction became the deterministic plan command (TASK-9.7); (2) the silent strict-mode block became the near-miss warning (TASK-24); (3) the n8n pilot's execution UI (TASK-22) turned out to be the live view a micro-TUI would have offered — gate verdicts, agent rounds, parked approvals, per-node payloads, in real time. What nobody missed in practice: watching individual T-task checkbox flips. A bespoke tasks.md watcher would duplicate the orchestration surface. Revisit only if a real usage pain re-raises it — as a new task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decision checkpoint closed: no micro-level TUI gets built. The general appetite for MORE was satisfied by three shipped things the first spin could not have foreseen — the plan command (computed sync), the strict-mode near-miss warning, and the n8n pilot's execution view, which is a richer live surface than a tasks.md watcher would have been. Decision recorded with rationale in notes; any future revival starts as a fresh task grounded in a concrete usage pain.
<!-- SECTION:FINAL_SUMMARY:END -->
