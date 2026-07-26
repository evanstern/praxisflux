# 008-principles-p2-refinements — tasks

## Spec

- [x] T000 claim: board TASK-33 → In Progress + spec dir stub, pushed
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 P2: reason-to-approve test stated canonically (R1)
- [x] T003 P2: three-tier model (EPIC/TASK/SUBTASK), task-system-agnostic (R2)
- [x] T004 pdlc template stamped region synced (or finding recorded); versions bumped if touched (R3) — synced: the template's "One TASK, one PR" rule restates the tier model itself, so the EPIC tier + reason-to-approve test reach it; bootstrap 0.2.0→0.3.0, marketplace 0.15.0→0.16.0
- [x] T005 wiki re-pins per freshness gate; CAPSULES.md regen if needed (R4) — 11 notes re-pinned to 287b6b0 (pdlc-plugin re-verified substantively for the refined template; the other 10 stamp-only from the 0.16.0 lockstep bump); no capsule changed, no CAPSULES regen

## Prove

- [x] T006 gates green: node --test (167 pass), check-docs, wiki-freshness (27 fresh), bump gate 0.15.0 → 0.16.0; course deferred to the orchestrator per R5 (policy in flight in TASK-41)
- [x] T007 board finalized (ACs checked, Done, final summary); PR + serial merge (after
  TASK-41, per lane doctrine) recorded by the orchestrator in the runbook execution log
