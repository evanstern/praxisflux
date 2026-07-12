---
id: TASK-26
title: 'Runner per-run isolation: worktrees/clones instead of a shared checkout'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-12 01:23'
updated_date: '2026-07-12 01:51'
labels: []
dependencies: []
priority: high
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pilot finding (findings.md; demonstrated live when a human branch-switch nearly corrupted an in-flight agent round): the runner's real-repo /checkout branch-switches a shared working tree. Give each run an isolated git worktree (or clone) of the target; the agent works there; /finish merges back into the target's main and cleans up. Concurrent runs and humans in the original tree become non-events. HIGH because it is the single hard prerequisite for self-hosting (TASK-30).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /checkout {target} creates an isolated per-run worktree/clone; the original tree is never touched mid-run
- [x] #2 A human switching branches in the target during a run demonstrably cannot affect the run (test or scripted repro)
- [x] #3 /finish merges the run's work into the target main and removes the worktree; failure paths leave no litter
- [x] #4 Pilot docs (README/findings) updated
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. runner /checkout {target}: replace in-place branch-switch with 'git worktree add <tmpdir>/<runId> -b pilot/<runId> main' on the target — the run gets its own working tree; the target's checkout is never touched. Keep scratch-fixture mode unchanged (already isolated by construction).
2. /agent and /gate already cwd into run.dir — they inherit isolation for free.
3. /finish: commit in the worktree, then merge --no-ff into the target's main via 'git -C <target> merge' ONLY if the target's tree is clean on main? No — safer: merge in a detached way: run 'git fetch' semantics locally... simplest correct: merge from the TARGET repo ('git -C target merge --no-ff pilot/<runId>') without switching the target's current branch — merge requires being ON main; if the target is on another branch or dirty, finish must fail loudly and leave the worktree for inspection rather than force anything.
4. Cleanup: 'git worktree remove' + branch delete on successful finish; failure paths leave the worktree + a log line naming it.
5. Repro test: script that starts a run, switches the target's branch mid-run, proves the run's tree is unaffected; plus concurrent-runs smoke (two checkouts of the same target coexist).
6. Docs (pilot README + findings) updated; live re-verify with a real tamagotchi run; per-task course; PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shipped: /checkout {target} -> per-run git worktree on pilot/<runId> (target checkout never touched); /finish merges --no-ff into target main only from a clean main, else refuses loudly with the worktree kept and named. test-isolation.sh replays the live incident as a passing check + concurrency + refusal + clean landing, 5/5 first run. Production runner restarted. README/findings updated (finding resolved). Course gate initially FAILED (missing group chat) — the convention's gate catching its own convention; fixed and passed. TASK-30 unblocked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The pilot runner's shared-checkout hazard is closed: real-repo runs execute in isolated per-run git worktrees (pilot/<runId> off main) — humans or other sessions in the target are structurally non-events, and concurrent runs coexist. /finish merges --no-ff into the target's main only from a clean main, refusing loudly otherwise with the approved work kept safe in its named worktree (a human is guaranteed present at landing — it is the approval step). The live incident is encoded as a passing check in test-isolation.sh alongside concurrency, refusal, and cleanup checks. Docs updated, findings entry resolved, per-task course shipped (2 modules). Self-hosting (TASK-30) unblocked.
<!-- SECTION:FINAL_SUMMARY:END -->
