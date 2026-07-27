# 027-scripts-template-hygiene — tasks

## Spec

- [x] T000 claim: board TASK-66 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [ ] T002 hook quoting: five hooks.json + scaffold template; shim/e2e tests green (R1)
- [ ] T003 build.mjs: scoped --plugin clean; missing argv value → usage (R2)
- [ ] T004 new-plugin.mjs: count claims updated at scaffold time; fixture README carries
  a count claim; header contract true (R3)
- [ ] T005 check-version-bump.mjs: non-semver base fails loudly (R4)
- [ ] T006 tests for all four
- [ ] T007 versions: marketplace sync-version (verify next free)
- [ ] T008 wiki: build-and-release, release-pipeline, skill-patterns, gates-convention
  (+ hooks.json-listing notes) re-verified + re-pinned; lockstep stales classified;
  CAPSULES if descriptions changed

## Prove

- [ ] T009 gates green: node --test, check-docs, wiki freshness, bump gate
- [ ] T010 board finalized (ACs checked, Done, final summary); PR opened
