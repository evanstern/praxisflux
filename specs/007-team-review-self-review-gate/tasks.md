# 007-team-review-self-review-gate — tasks

## Spec

- [x] T000 claim: board TASK-42 → In Progress + spec dir stub, pushed
- [x] T001 spec.md / plan.md / tasks.md authored

## Implement

- [x] T002 .handoff residue invisible to the read-only comparison (begin AND finish paths) (R1)
      — shape chosen: ignore-in-comparison (`stripHandoffEntries` applied to BOTH sides of the
      porcelain diff in `checkReview`), not snapshot-after-write: one mechanism covers begin,
      finish, and every mid-run record write (a second run's begin, abandon), stays correct
      when `.handoff/` is partially tracked (untracked entries then don't collapse to one
      line), and old run records whose snapshots already captured residue compare clean.
- [x] T003 self-review gitignore notice, decision recorded (R2)
      — decision: prominent multi-line WARN on stderr when invoking root == target and
      `.handoff/` is not gitignored; NOT a hard fail, because self-review must work in repos
      that never gitignored the transport — failing begin would reintroduce the very block
      the R1 gate exemption removes. Non-self-review keeps the existing one-line warning.
- [x] T004 regression test: untouched target passes, mutated target blocks (R3)
      — `run lifecycle: self-review with in-repo run records passes untouched, still blocks
      a mutated target` (CLI, doc-1 repro) + `checkReview: .handoff transport residue never
      reads as target mutation — genuine changes still do` (gate unit).
- [x] T005 versions: team-review skill 1.0.0 → 1.1.0 (self-review note added to SKILL.md);
      marketplace + all plugin.json + action.yml pin → 0.16.0 via sync-version.mjs (R4)
- [x] T006 wiki: team-review-plugin note re-verified + re-pinned (two-step: body updated for
      the gate exemption, escalated WARN, self-review placement, skill 1.1.0 — then pinned);
      test-suite note re-verified (team-review bullet) within budget; lockstep-stamp stales
      hand-reviewed (all quoted literals historical) and re-pinned; descriptions unchanged,
      so CAPSULES.md needed no regeneration

## Prove

- [x] T007 gates green: node --test 169/169 pass, check-docs in sync, wiki-freshness OK 27
      notes (course deliberately not built — orchestrator decides the obligation at merge
      time per the in-flight policy change)
- [ ] T008 board finalized; PR opened — serial merge recorded by the orchestrator
