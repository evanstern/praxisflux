# 037-sweep-turn-hygiene-cost-accounting — tasks

## Spec

- [x] T000 claim: board TASK-88 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [ ] T002 SKILL.md step 5 dispatch guidance carries the turn-hygiene block (batched parallel calls, minimal narration, lower effort on mechanical phases), rationale stated (R1)
- [ ] T003 templates/runbook.md execution log gains the tokens/cost (best-effort) column (R2)
- [ ] T004 SKILL.md states the orchestrator SHOULD end its session at lane boundaries, resume from runbook + board, as a cost prescription (R3)
- [ ] T005 version bumps: sweep skill 0.12.0 + marketplace via sync-version.mjs (R4)

## Prove

- [ ] T006 docs/wiki/pdlc-sweep.md re-verified against the diff (NEEDS-REVIEW), amended within budgets (split if needed), re-pinned; lockstep-staled siblings RE-PIN-ONLY; CAPSULES regenerated if description changed
- [ ] T007 gates green in worktree (node --test, check-docs, freshness, version-bump); PR opened
- [ ] T008 board finalized (ACs checked, Done via spec-bridge:sync, final summary); merged
