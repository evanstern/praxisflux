# 034-demo-rig — tasks

## Spec

- [x] T000 claim: board TASK-73 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored (design from the TASK-73 card, ratified 2026-07-27)

## Implement

- [x] T002 demo app + generator skeleton: deterministic replay engine, tags, --stage/--reset, outside-checkout isolation, optional --remote (R1, R3-wiring)
- [x] T003 capture run stage-0..2: app baseline; real vault+wiki-build; board+specs+links+signed-off mini runbook; live-thread task pre-specced unmerged (R2, R4)
- [x] T004 capture run stage-3..4 against the operator-named sandbox: real mini-sweep with merged PRs + live task's merged twin; headless refactor-triage record + debt cards; fixtures + manifest snapshotted (R2, R3, R4)
- [x] T005 per-stage gate matrix (--check) green on a fresh generate: freshness at 1/3/4, spec-bridge at 2/3, app tests at 0 (R2)
- [x] T006 CI test test/demo-rig.test.mjs: tags + gate matrix + double-generate repeatability; catalog bullet (R6, R8)
- [x] T007 RUNSHEET.md: 30-minute script with live gate-break, spec-bridge block, live-task thread, triage beat, fallbacks (R5)

## Prove

- [ ] T008 gates green in worktree (node --test, check-docs, freshness, version-bump verdict); new wiki note demo-rig + INDEX + CAPSULES; README updated (R7)
- [ ] T009 board finalized (ACs checked; Done via spec-bridge:sync); PR opened and merged
