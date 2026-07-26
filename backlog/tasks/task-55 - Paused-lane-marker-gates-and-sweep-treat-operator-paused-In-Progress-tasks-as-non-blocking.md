---
id: TASK-55
title: >-
  Paused-lane marker: gates and sweep treat operator-paused In Progress tasks as
  non-blocking
status: Done
assignee:
  - '@claude'
created_date: '2026-07-26 18:08'
updated_date: '2026-07-26 20:36'
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

Spec: specs/015-paused-lane-marker
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A documented, CLI-set paused marker exists and is machine-findable on the card
- [x] #2 check-merge-drift.mjs downgrades paused tasks' branch/worktree findings to non-blocking info in all three modes
- [x] #3 pdlc:sweep excludes paused tasks from lane conflict analysis and lists them as untouched in the runbook header
- [x] #4 Host repos pick the behavior up via a normal version bump (lockstep law)
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
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

Implemented, both legs. Praxis: paused-label convention documented (CLI-set label, machine-findable in frontmatter labels:, provenance append-note, resume note on clear); sweep Phase-1 excludes paused tasks from lane conflict analysis; runbook template gains the paused-untouched header slot + doctrine line; sweep 0.5.0, marketplace 0.25.0. Promptworld: PR #117 merged (their TASK-155 Done, spec 080) — check-merge-drift downgrades paused lanes to info in all three modes with paused:TASK-n evidence; cleanup prescriptions excluded; spec-069 grounding blocks and claim-mode collisions deliberately NOT downgraded (pausing is not a gate bypass); 6 new tests 21/21. pdlc-plugin three-way (trace + paused paragraphs) merged under the 8000 budget, citations verified per actual shipping release (0.23.0 trace / 0.25.0 paused).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Paused lanes are now first-class across the toolchain: a CLI-set paused label (machine-findable in the card's frontmatter, provenance as an append-note) marks an In Progress lane as deliberately not live; pdlc:sweep excludes paused tasks from lane conflict analysis and lists them 'paused — untouched' in the runbook header, never claiming/rebasing/cleaning their branches; and host merge-drift gates read the same label — promptworld's check-merge-drift (PR #117, their TASK-155) downgrades paused-lane findings to info in all three modes while deliberately keeping grounding blocks and claim-mode collisions blocking (pausing is not a gate bypass). sweep 0.5.0, marketplace 0.25.0. The operator's promptworld pause scenario (three paused lanes + a sweep) no longer needs verbatim relays in every dispatch.
<!-- SECTION:FINAL_SUMMARY:END -->
