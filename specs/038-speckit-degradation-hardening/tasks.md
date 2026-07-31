# 038-speckit-degradation-hardening — tasks

## Spec

- [x] T000 claim: board TASK-84 → In Progress + spec dir stub + Spec marker linked in the claim commit (gate armed)
- [x] T001 spec.md / plan.md / tasks.md authored (real content, not stubs)

## Implement

- [x] T002 SKILL.md step 3 names spec.md/plan.md/tasks.md with claim-step specificity, incl. absent/unratified-constitution handling (R1)
- [x] T003 SKILL.md step 2 claim commit carries the link (marker on card, stub dir suffices, gate armed from first commit); step 4 repurposed to link completion (phase-AC seeding + marker verify), numbering stable (R2)
- [x] T004 templates/runbook.md gains "Per-task artifacts required before PR" section with escape-line slot (R3)
- [x] T005 Output gate adds the blessed spec+plan+tasks-or-recorded-escape-line clause, composing with TASK-79 (R4)
- [x] T006 doctrine sentence: Lane-0 decisions that change the per-task loop land as checkable runbook gate lines, not prose (R5)
- [x] T007 version bumps: sweep skill 0.13.0 + marketplace via sync-version.mjs (R7)

## Prove

- [x] T008 TASK-79 ↔ TASK-84 cross-referenced (append-notes both cards); non-contradiction verification recorded (R6)
- [x] T009 docs/wiki/pdlc-sweep.md re-verified (NEEDS-REVIEW); summary-style split executed within budgets; INDEX/CAPSULES updated; lockstep siblings RE-PIN-ONLY (R7)
- [x] T010 gates green in worktree (node --test, check-docs, freshness, version-bump); PR opened only with real spec+plan+tasks present (this task’s own rule)
- [ ] T011 board finalized (ACs checked, Done via spec-bridge:sync, final summary); merged
