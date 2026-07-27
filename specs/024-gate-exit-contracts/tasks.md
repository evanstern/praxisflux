# 024-gate-exit-contracts — tasks

## Spec

- [x] T000 claim: board TASK-65 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 run-gates.mjs: gate execution outside the usage try/catch — throwing gate
  reports and exits 1; usage errors alone exit 2 (R1)
- [x] T003 consuming-gates.md verified accurate (amended minimally if needed) (R1)
- [x] T004 stop-docs.mjs: realpath both sides + path-separator boundary (R2)
- [x] T005 gate-runner.mjs: crashing resolveRoots surfaces as a blocking problem (R3)
- [x] T006 regression tests: throwing gate → exit 1; symlinked launch fires stop-docs,
  sibling dir never matches; resolveRoots throw surfaces
- [x] T007 versions: marketplace sync-version (released surface)
- [x] T008 wiki: gate-runner + gates-consumption-surface + test-suite re-verified +
  re-pinned; CAPSULES if descriptions changed

## Prove

- [x] T009 gates green: node --test, check-docs, wiki freshness, bump gate
- [ ] T010 board finalized (ACs checked, Done, final summary); PR opened
