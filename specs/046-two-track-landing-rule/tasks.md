# 046-two-track-landing-rule — tasks

## Spec

- [x] T000 claim: board TASK-85 → In Progress + spec dir stub + Spec marker linked in the claim commit (gate armed)
- [x] T001 spec.md / plan.md / tasks.md authored (real content, not stubs)

## Implement

- [x] T002 planted backlog block states the two-track rule, derived from the reason-to-approve principle, with the no-main-push degradation clause (R1+R2)
- [x] T003 replant path confirmed/stated: block refreshes wholesale on bootstrap update (R3)
- [x] T004 sweep SKILL.md references the planted rule in one clause (no restatement; composes with the TASK-90 mode sentence) (R4)
- [x] T005 version bumps: bootstrap skill 0.8.0 (+ sweep skill next minor if changed) + marketplace via sync-version.mjs at merge-readiness (R5)

## Prove

- [x] T006 wiki notes re-verified against the diff (pdlc-plugin, pdlc-sweep NEEDS-REVIEW; siblings classified); repo CLAUDE.md synced if check-docs demands
- [x] T007 gates green in worktree (node --test incl. plant tests, check-docs, freshness, version-bump); re-run after any history move
- [x] T008 board finalized (ACs checked, Done via spec-bridge:sync, final summary); merged
