# 027-scripts-template-hygiene — tasks

## Spec

- [x] T000 claim: board TASK-66 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 hook quoting: five hooks.json + scaffold template; shim/e2e tests green (R1)
- [x] T003 build.mjs: scoped --plugin clean; missing argv value → usage (R2)
- [x] T004 new-plugin.mjs: count claims updated at scaffold time; fixture README carries
  a count claim; header contract true (R3)
- [x] T005 check-version-bump.mjs: non-semver base fails loudly (R4)
- [x] T006 tests for all four
- [x] T007 versions: marketplace sync-version (verify next free)
- [x] T008 wiki: build-and-release, release-pipeline, skill-patterns, gates-convention
  (+ hooks.json-listing notes) re-verified + re-pinned; lockstep stales classified;
  CAPSULES if descriptions changed

## Prove

- [x] T009 gates green: node --test, check-docs, wiki freshness, bump gate
- [x] T010 board finalized (ACs checked, Done, final summary); PR opened
