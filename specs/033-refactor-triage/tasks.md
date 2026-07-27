# 033-refactor-triage — tasks

## Spec

- [x] T000 claim: board TASK-72 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored (design from the TASK-72 card, agreed 2026-07-27)

## Implement

- [x] T002 SKILL.md: frontmatter + precondition gate + Scope phase with the three entry modes (R1, R2)
- [x] T003 Evaluate phase: team-review orchestration via lens, inline degradation, range-mode intent-drift pass (R3, R4)
- [x] T004 Triage + Execute phases: tracked run-id-keyed triage record; accepted findings → cited, labeled backlog tasks (R5, R6)
- [x] T005 prose output gate + Handing off; sweep SKILL.md Handing off names refactor-triage, version bumped (R7, R8)
- [x] T006 tests extended in test/pdlc.test.mjs; pdlc/README.md updated (R1, R9)

## Prove

- [ ] T007 gates green in worktree (node --test, check-docs, freshness); sync-version 0.40.0 + skill version bumps; new wiki note + INDEX + CAPSULES; pdlc-plugin/pdlc-sweep NEEDS-REVIEW re-pins (R9)
- [ ] T008 board finalized (ACs checked; Done via spec-bridge:sync); PR opened
