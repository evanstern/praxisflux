# 041-pdlc-enumeration-drift — tasks

## Spec

- [x] T000 claim: board TASK-74 → In Progress + spec dir stub + Spec marker linked in the claim commit (gate armed)
- [x] T001 spec.md / plan.md / tasks.md authored (real content, not stubs)

## Implement

- [ ] T002 pdlc/templates/CLAUDE.md pdlc bullet names all three verbs incl. refactor-triage (R1)
- [ ] T003 plugin.json description + keywords (triage/debt); marketplace.json regenerated, never hand-edited (R2)
- [ ] T004 root README pdlc role cell consistent; style decision recorded (R3)
- [ ] T005 this repo's CLAUDE.md re-planted at current version — hand-edit diff first, never clobber (R4a)
- [ ] T006 version bumps: bootstrap skill version + marketplace via sync-version.mjs at merge-readiness (R5)

## Prove

- [ ] T007 docs/wiki/overview.md amended + re-pinned (NEEDS-REVIEW — prose was wrong); pdlc-plugin note classified; CAPSULES regenerated if any description changed
- [ ] T008 gates green in worktree (node --test, check-docs incl. post-replant, freshness, version-bump); re-run after any history move
- [ ] T009 board finalized (ACs checked, Done via spec-bridge:sync, final summary); merged
