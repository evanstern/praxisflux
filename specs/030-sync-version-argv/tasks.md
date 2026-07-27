# 030-sync-version-argv — tasks

## Spec

- [x] T000 claim: board TASK-69 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 call-site audit recorded; no consumer of the bare no-arg mode remains
- [x] T003 argv validation: only --check or strict x.y.z accepted; usage + exit 2 otherwise, zero files touched (R1)
- [x] T004 valid x.y.z and --check behavior unchanged; header comment updated (R2)
- [x] T005 regression test: refusals + no-files-touched guarantee; catalog bullet if a new test file (R3)

## Prove

- [ ] T006 gates green in worktree (node --test, check-docs, freshness) + version bump + staled notes re-pinned
- [ ] T007 board finalized (ACs checked, Done, final summary); PR opened
