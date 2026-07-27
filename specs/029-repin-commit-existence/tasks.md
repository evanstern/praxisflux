# 029-repin-commit-existence — tasks

## Spec

- [x] T000 claim: board TASK-68 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 repin() existence probe before write; named errors; note untouched on refusal (R1)
- [x] T003 existing refusals + CLI contract unchanged (R2)
- [x] T004 regression test: nonexistent-commit refusal + note byte-identical (R3)

## Prove

- [x] T005 gates green in worktree (node --test, check-docs, freshness) + version bump + staled notes re-pinned
- [x] T006 board finalized (ACs checked, Done, final summary); PR opened
