# 018-sweep-merge-over-rebase — tasks

## Spec

- [x] T000 claim: board TASK-57 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 SKILL.md: step 7 + concurrency doctrine rewritten — pin-carrying branches
  merge origin/main in (re-pin conflicts to the merge commit), squash/rebase/force-push
  named pin-breaking, rebase kept for pin-free branches; dependent sentences updated (R1)
- [x] T003 templates/runbook.md: doctrine section mirrors the same split (R1)
- [x] T004 freshness probe prescribed after every history move, unconditional, both
  files (R2)
- [x] T005 versions: sweep skill 0.5.0 → 0.6.0; marketplace sync-version 0.27.0 (R3)
- [x] T006 wiki: pdlc-plugin re-verified + re-pinned; lockstep stales re-pinned;
  CAPSULES if description changed (R3)

## Prove

- [x] T007 gates green: node --test, check-docs, wiki freshness, bump gate
- [x] T008 board finalized (ACs checked, Done, final summary); PR opened
