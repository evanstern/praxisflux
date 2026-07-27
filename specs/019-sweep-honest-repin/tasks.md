# 019-sweep-honest-repin — tasks

## Spec

- [x] T000 claim: board TASK-58 → In Progress + spec dir, committed on the task branch
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [ ] T002 SKILL.md: step 7 + concurrency doctrine — post-merge-in staleness routed
  through the wiki-update plan loop (RE-PIN-ONLY vs NEEDS-REVIEW against the main-side
  diff); no mechanical merge-commit re-pin text remains (R1, R2)
- [ ] T003 templates/runbook.md: reconcile bullet mirrors the same procedure (R1, R2)
- [ ] T004 downstream-host paragraph: safe procedure stated for hosts that inherited
  the TASK-57 convention (R2)
- [ ] T005 versions: sweep SKILL.md version bump + marketplace sync-version (R3)
- [ ] T006 wiki: docs/wiki/pdlc-sweep.md re-verified + re-pinned; CAPSULES if the
  description changed (R3)

## Prove

- [ ] T007 gates green: node --test, check-docs, wiki freshness, bump gate
- [ ] T008 board finalized (ACs checked, Done, final summary); PR opened
