---
id: TASK-55
title: >-
  Paused-lane marker: gates and sweep treat operator-paused In Progress tasks as
  non-blocking
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-26 18:08'
updated_date: '2026-07-26 19:54'
labels:
  - pdlc
  - gates
dependencies: []
ordinal: 90000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Observed in promptworld 2026-07-26: the operator paused three In Progress lanes (TASK-111/136/137) and dispatched a pdlc:sweep over other tasks. Nothing on a Backlog board distinguishes paused from live In Progress, and 'In Progress + branch exists' is exactly the signature the merge-drift gates and the sweep's concurrency doctrine treat as another session's live lane — so paused work reads as a collision unless the operator relays the pause verbatim in every sweep prompt (fragile, per-dispatch, easy to forget).

Implement a first-class paused/parked lane marker the tooling understands:
- A machine-findable marker on the task (label 'paused', or a dedicated status if Backlog.md supports custom statuses) set/cleared via the backlog CLI only.
- check-merge-drift.mjs (session/worktree/pr modes in host repos): a paused task's branch/worktree stops producing blocking collision findings — downgraded to info with the pause noted as evidence.
- pdlc:sweep runbook authoring: paused tasks are excluded from lane conflict analysis and listed in the runbook header as 'paused — untouched'; the sweep never claims, rebases, or cleans their branches/worktrees.
- Pause provenance: who/when recorded on the card (append-note convention), so a stale pause is auditable.

Related: the reorient run ownership/concurrency rethink tracked host-side as promptworld TASK-148 — same family (cross-session state needs origin-visible ownership/liveness), different artifact. Praxis laws apply: version-lockstep, merge-commit-only, per-task-course.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A documented, CLI-set paused marker exists and is machine-findable on the card
- [ ] #2 check-merge-drift.mjs downgrades paused tasks' branch/worktree findings to non-blocking info in all three modes
- [ ] #3 pdlc:sweep excludes paused tasks from lane conflict analysis and lists them as untouched in the runbook header
- [ ] #4 Host repos pick the behavior up via a normal version bump (lockstep law)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 015-paused-lane-marker (hand-authored)
2. spec-bridge:link
3. Dispatch praxis leg: documented CLI-set paused label convention (+ provenance append-note convention); pdlc:sweep SKILL.md + runbook template exclude paused tasks from lane conflict analysis, list them 'paused — untouched' in a runbook header slot
4. Cross-repo leg (operator-approved at sign-off): promptworld PR — check-merge-drift.mjs downgrades paused tasks' branch/worktree findings to info in session/worktree/pr modes, under promptworld's own gates
5. Versions (pdlc sweep skill + marketplace); wiki re-pins; praxis PR; serial merge; task Done only when BOTH legs merged
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 1 (docs/design/lane-hardening-runbook.md). Tier: default implementer. Decision at sign-off: gate stays host-side (consume-when-present, TASK-46); both legs ship in this task.
<!-- SECTION:NOTES:END -->
