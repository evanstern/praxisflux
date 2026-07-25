---
id: TASK-46
title: 'pdlc:sweep — bake merge-drift gates into the sweep loop'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-25 18:35'
updated_date: '2026-07-25 18:51'
labels: []
dependencies: []
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sweep currently rediscovers per-repo gate machinery from CLAUDE.md at runbook-authoring time. Host projects following the promptworld spec-051 pattern now ship a merge-drift gate script (scripts/check-merge-drift.mjs with session/worktree/pr modes and 0/1/2 exit codes: textual-conflict prediction via merge-tree, n-way drift matrix, janitor prescriptions, spec-number collision checks). Make the sweep skill probe for that gate and, when present, treat its three modes as standing mandatory steps at the matching choke points — session gate at sweep start (its drift matrix also feeds lane construction), worktree gate before each worktree add (with --spec NNN), pr gate before each PR (and after each rebase) — rather than relying on runbook authors re-deriving them. Update the runbook template's gates section to carry the probe result.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 sweep SKILL.md precondition gate runs the host's merge-drift session gate (when the script exists) as/alongside the root-discipline check, and its drift matrix informs lane construction in Phase 1
- [x] #2 Phase 1 step 3 (per-PR gates enumeration) explicitly names the merge-drift gate pattern as a first-class thing to probe for, with the three invocations recorded in the runbook when found
- [x] #3 Phase 2 loop steps invoke the worktree gate before git worktree add (with --spec NNN when a spec number is being claimed) and the pr gate before opening each PR and after each rebase, blocking on nonzero exit
- [x] #4 templates/runbook.md gates section carries a merge-drift probe line (present/absent + invocations)
- [x] #5 sweep SKILL.md version bumped; marketplace version bumped per docs/releasing.md; sync-version check passes
- [x] #6 docs/wiki/pdlc-plugin.md re-verified and re-pinned (its sources include sweep SKILL.md and runbook template)
- [x] #7 per-task course at docs/courses/TASK-46 passes the course gate
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-46-sweep-merge-drift from main. 2. Amend pdlc/skills/sweep/SKILL.md: precondition gate (session-gate probe + run), Phase 1 step 3 (probe + enumerate), Phase 2 steps 1/2/4/6/7 (worktree + pr gate invocations), concurrency doctrine (drift matrix), bump skill version 0.1.0 -> 0.2.0. 3. Amend templates/runbook.md gates section. 4. Bump marketplace 0.12.0 -> 0.12.1 + run scripts/sync-version.mjs. 5. Run scripts/check-docs.mjs + wiki freshness; re-verify + re-pin docs/wiki/pdlc-plugin.md. 6. Build docs/courses/TASK-46 (delegated), pass course gate. 7. Push, PR (merge commit, never squash).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Slices 1-2 committed: sweep SKILL.md 0.2.0 (precondition probe step 3, lane-evidence bullet, Phase 1 step 3 probe record, Phase 2 steps 1/2/4/7 gate invocations, doctrine bullet), runbook template gates line, marketplace synced 0.12.1 (dee138b); wiki pdlc-plugin.md re-verified + re-pinned to dee138b. Remaining: per-task course TASK-46 (delegating), push + PR.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
pdlc:sweep 0.2.0 consumes host merge-drift gates (promptworld spec-051 pattern) at every choke point: precondition probe runs session mode at sweep start (subsumes root fetch/ff-pull, janitor prescriptions, drift matrix into lane construction), worktree [--spec NNN] gates each worktree add, pr mode gates each PR and re-runs after every rebase; runbook template records the probe result. Marketplace 0.12.1 lockstep; wiki: pdlc-plugin.md re-verified + all 9 stamp-stale sibling notes re-pinned per the computed plan; per-task course docs/courses/TASK-46 (3 modules) gate-green. Ships as one PR, merge-commit flow.
<!-- SECTION:FINAL_SUMMARY:END -->
