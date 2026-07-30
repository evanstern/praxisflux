# 035-sweep-model-id-pinning — tasks

## Spec

- [x] T000 claim: board TASK-86 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 SKILL.md Phase 1 item 2 requires explicit model ID per tier in the runbook (R1)
- [x] T003 SKILL.md step 5 dispatch passes the model ID explicitly, never session inheritance, rationale stated (R2)
- [x] T004 templates/runbook.md lane entries + dispatch-record line carry the model-ID slot (R3)
- [x] T005 version bumps: sweep skill 0.10.0 + marketplace via sync-version.mjs (R4)

## Prove

- [ ] T006 docs/wiki/pdlc-sweep.md re-verified against the diff (NEEDS-REVIEW), amended, re-pinned; CAPSULES regenerated if description changed
- [ ] T007 gates green in worktree (node --test, check-docs, freshness, version-bump); PR opened
- [ ] T008 board finalized (ACs checked, Done via spec-bridge:sync, final summary); merged
