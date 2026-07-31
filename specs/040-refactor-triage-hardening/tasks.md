# 040-refactor-triage-hardening — tasks

## Spec

- [x] T000 claim: board TASK-75 → In Progress + spec dir stub + Spec marker linked in the claim commit (gate armed)
- [x] T001 spec.md / plan.md / tasks.md authored (real content, not stubs)

## Implement

- [ ] T002 Evaluate phase: version-independent tracked-copy check + manual-copy fallback, inline mode names the same report home (R1)
- [ ] T003 headless mode: named policy argument + third README example + detection rule (R2)
- [ ] T004 run-id minting rule stated for engine and degraded modes (R3)
- [ ] T005 output gate enforces evaluation-report trackedness (both-tracked promise kept honest) (R4)
- [ ] T006 version bumps: refactor-triage skill 0.1.0 → 0.2.0 + marketplace via sync-version.mjs at merge-readiness (R5)

## Prove

- [ ] T007 docs/wiki/pdlc-refactor-triage.md re-verified against the diff (NEEDS-REVIEW, description must not grow); CAPSULES regenerated only if description changed; lockstep siblings classified
- [ ] T008 gates green in worktree (node --test, check-docs, freshness, version-bump); re-run after any history move
- [ ] T009 board finalized (ACs checked, Done via spec-bridge:sync, final summary); merged
