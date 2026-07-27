# 021-team-review-report-path — tasks

## Spec

- [x] T000 claim: board TASK-61 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 run.mjs: default report path under the runs home, outside the target;
  explicit --report unchanged (R1)
- [x] T003 run.mjs: default filename run-id-keyed — same-day runs never collide (R3)
- [ ] T004 SKILL.md report-path claim matches the new rule (R2)
- [ ] T005 tests: self-review round trip passes on defaults; same-day uniqueness (R4)
- [ ] T006 versions: team-review skill bump + marketplace sync-version
- [ ] T007 wiki: team-review-plugin re-verified + re-pinned; CAPSULES if description
  changed

## Prove

- [ ] T008 gates green: node --test, check-docs, wiki freshness, bump gate
- [ ] T009 board finalized (ACs checked, Done, final summary); PR opened
