---
id: TASK-46
title: 'pdlc:sweep — bake merge-drift gates into the sweep loop'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-25 18:35'
updated_date: '2026-07-25 18:35'
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
- [ ] #1 sweep SKILL.md precondition gate runs the host's merge-drift session gate (when the script exists) as/alongside the root-discipline check, and its drift matrix informs lane construction in Phase 1
- [ ] #2 Phase 1 step 3 (per-PR gates enumeration) explicitly names the merge-drift gate pattern as a first-class thing to probe for, with the three invocations recorded in the runbook when found
- [ ] #3 Phase 2 loop steps invoke the worktree gate before git worktree add (with --spec NNN when a spec number is being claimed) and the pr gate before opening each PR and after each rebase, blocking on nonzero exit
- [ ] #4 templates/runbook.md gates section carries a merge-drift probe line (present/absent + invocations)
- [ ] #5 sweep SKILL.md version bumped; marketplace version bumped per docs/releasing.md; sync-version check passes
- [ ] #6 docs/wiki/pdlc-plugin.md re-verified and re-pinned (its sources include sweep SKILL.md and runbook template)
- [ ] #7 per-task course at docs/courses/TASK-46 passes the course gate
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-46-sweep-merge-drift from main. 2. Amend pdlc/skills/sweep/SKILL.md: precondition gate (session-gate probe + run), Phase 1 step 3 (probe + enumerate), Phase 2 steps 1/2/4/6/7 (worktree + pr gate invocations), concurrency doctrine (drift matrix), bump skill version 0.1.0 -> 0.2.0. 3. Amend templates/runbook.md gates section. 4. Bump marketplace 0.12.0 -> 0.12.1 + run scripts/sync-version.mjs. 5. Run scripts/check-docs.mjs + wiki freshness; re-verify + re-pin docs/wiki/pdlc-plugin.md. 6. Build docs/courses/TASK-46 (delegated), pass course gate. 7. Push, PR (merge commit, never squash).
<!-- SECTION:PLAN:END -->
