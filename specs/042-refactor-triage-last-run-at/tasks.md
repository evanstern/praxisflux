# 042-refactor-triage-last-run-at — tasks

## Spec

- [x] T000 claim: board TASK-80 → In Progress + spec dir stub + Spec marker linked in the claim commit (gate armed)
- [x] T001 spec.md / plan.md / tasks.md authored (real content, not stubs)

## Implement

- [x] T002 tracked triage record gains the documented machine-findable last-run-at line (full commit id; range end or HEAD-at-scan) (R1)
- [x] T003 Scope phase gains 'since last triage': resolve newest record's last-run-at → <id>..HEAD, verify it resolves, STOP with a clear message when no prior record / unresolvable (R2)
- [x] T004 version bumps: refactor-triage skill 0.2.0 → 0.3.0 + marketplace via sync-version.mjs at merge-readiness (R3)

## Prove

- [x] T005 docs/wiki/pdlc-refactor-triage.md re-verified against the diff (NEEDS-REVIEW, description must not grow); lockstep siblings classified
- [x] T006 gates green in worktree (node --test, check-docs, freshness, version-bump); re-run after any history move
- [x] T007 board finalized (ACs checked, Done via spec-bridge:sync, final summary); merged
