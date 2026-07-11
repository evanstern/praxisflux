---
id: TASK-9.6
title: 'Re-examine micro-level TUI: does the phases-as-ACs view need MORE'
status: To Do
assignee: []
created_date: '2026-07-10 02:26'
updated_date: '2026-07-10 03:21'
labels: []
dependencies:
  - TASK-9.3
parent_task_id: TASK-9
priority: low
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliberately deferred from the initial design. After living with sync + phases-as-ACs on a real spec, evaluate whether a richer live view of Spec Kit micro progress is wanted (e.g. a small renderer over tasks.md showing individual T-task flips in real time, or deeper Backlog board integration). The user has stated a general appetite for MORE; this task is the checkpoint to decide what MORE means with usage experience in hand. Outcome may be: do nothing, small tasks.md watcher/renderer, or a follow-up epic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decision recorded (in this task's notes) on whether/what to build, based on actual usage of the bridge
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Input from the first real spin (2026-07-09, real specify init + backlog init + full lifecycle in a scratch project): the bridge held end to end — link, 3 sync passes, tasks.md regeneration re-mirror, cheat-Done blocked (exit 2), strict-mode analysis flow, proven Done allowed. Friction observed for the MORE decision: (1) sync's AC re-mirroring is mechanical but wordy for the model (remove highest-index-first, re-add, re-check) — a 'cli.mjs plan <root>' that emits the exact backlog commands would make sync nearly deterministic; (2) in strict mode with the task honestly In Progress, a present-but-CRITICAL analysis.md produces no warning — Done is silently out of reach until you ask cli state; a lag-style notice could surface it; (3) phase names with parentheses and the marker's description round-trip through the backlog CLI both held up fine.
<!-- SECTION:NOTES:END -->
