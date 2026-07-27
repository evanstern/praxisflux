# 023-reorient-target-root — tasks

## Spec

- [x] T000 claim: board TASK-64 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 run.mjs: registry resolved from the target root per command; no module-load
  cwd capture (R1)
- [x] T003 run.mjs: worktree-first refusal evaluates the target checkout (R3)
- [x] T004 gate visibility: resolveRoots sees target-rooted runs from a session in the
  target (R2)
- [x] T005 tests: cross-directory begin/finish + refusal-keyed-to-target (R4)
- [x] T006 SKILL.md records-location claim true; versions: reorient bump +
  marketplace sync-version
- [x] T007 wiki: reorient-plugin + reorient-run-ownership re-verified + re-pinned;
  CAPSULES if descriptions changed

## Prove

- [x] T008 gates green: node --test, check-docs, wiki freshness, bump gate
- [ ] T009 board finalized (ACs checked, Done, final summary); PR opened
