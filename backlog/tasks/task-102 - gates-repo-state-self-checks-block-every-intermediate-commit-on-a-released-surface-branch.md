---
id: TASK-102
title: >-
  gates: repo-state self-checks block every intermediate commit on a
  released-surface branch
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-03 02:12'
updated_date: '2026-08-27 19:14'
labels:
  - debt
  - gates
  - tests
dependencies: []
priority: high
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in execution during the gates+doctrine sweep (2026-08-02): TASK-100 Phase 1, reproduced independently by TASK-93 Phase 2. Runbook amendment 1 in docs/design/gates-and-doctrine-sweep-runbook.md records the interim softening this card retires.

Two of this repo's own rules are mutually unsatisfiable for any multi-commit task touching released surface:

(1) Doctrine sequences the wiki re-pin to AFTER the commit that touched the sources (one docs-only re-pin commit at the end), and the version bump to merge-readiness.

(2) .githooks/pre-commit runs the full 'node --test', which includes test/run-gates.test.mjs:22 asserting 'the praxisflux repo itself passes spec-bridge and wiki-freshness'. .githooks/pre-push independently runs the freshness gate AND check-version-bump.

So the first commit touching a pinned source turns 'node --test' red, and every subsequent commit and push on that branch is blocked until the re-pin and bump land - which doctrine says must come last. The only ways through are --no-verify, re-pinning dishonestly mid-task, or abandoning phase-scoped commits.

Why it matters: this is almost certainly the mechanism behind TASK-100's field case. specs/048's branch carries several source-touching commits before its re-pin commit 67f1172, and TASK-100 records the result - '254 pass, 0 fail' reported and ticked while four notes were staled and the freshness gate was red. The report was true when run and false once committed. A hook that cannot be satisfied trains sessions to bypass it, and a bypassed gate reports green while proving nothing.

Shape (not prescriptive - the spec decides): run-gates.test.mjs:22 is a repo-STATE self-check, not a test of code behavior. Mid-PR redness there is correct by construction. Candidate fix: move repo-state self-checks out of the per-commit path into pre-push/CI, where end-state invariants belong, leaving 'node --test' to test code. Note the same shape one level up in check-version-bump on pre-push: correct as a CI mirror, but it blocks intermediate pushes and so defeats the sweep's push-immediately-for-auditability rule.

Relationship to TASK-100: same confusion (treating red-by-construction as broken), one level down. Deliberately NOT folded into TASK-100 - that card is about ticks vs gates, and widening it would be scope creep.

Spec: specs/057-repo-state-placement
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spec phase: Phase 1 — State the rule; compute the window
- [ ] #2 Spec phase: Phase 2 — Move the self-check; close the CI gap
- [ ] #3 Spec phase: Phase 3 — pre-push warns; stop-docs becomes window-aware
- [ ] #4 Spec phase: Phase 4 — Retire the softening, re-ground, close
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 057: name the RULE — repo-STATE self-checks (assertions about this checkout's end state) never gate an intermediate action; they gate the PR. Distinguish from code-behavior tests, which stay in node --test.
2. Move the repo self-check out of node --test into a pre-push/CI-only surface. MUST-FIX found while orienting: CI has NO spec-bridge step — run-gates.test.mjs:20 is currently the ONLY spec-bridge enforcement on this repo, so removing it without adding a CI step silently drops board-honesty enforcement.
3. pre-push freshness + check-version-bump: warn, exit 0 (operator ruling). Matches CLAUDE.md's own 'advisory local, authoritative CI' posture and pre-push's own comment.
4. stop-docs.mjs: keep BLOCKING but make it window-aware — mid-task source edits pending a re-pin get a notice; PR-ready red still blocks. Deliberately not weakened: TASK-105 exists to strengthen re-grounding.
5. Retire runbook amendment 1's --no-verify softening (gates-and-doctrine-sweep-runbook.md:30-32 says it expires when TASK-102 merges).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FIELD REPRODUCTION 2026-08-27, during this card's own claim — the wedge is BROADER than the card describes.

Claiming TASK-102 by the book (status In Progress + spec dir on the branch + Spec marker on the card) turned 'node --test' from 417 pass/0 fail to 416/1. Causal chain confirmed by flipping the status back (417/0) and forward again (416/1).

The failing assertion is run-gates.test.mjs's repo self-check, but the trigger is NOT wiki staleness — no note is stale yet. It is spec-bridge: the card says In Progress while specs/057 exists only on the task branch, so the root-reading gate sees 'spec.md missing, plan.md missing, no tasks in tasks.md'.

Two consequences for spec 057:

(1) The card frames the wedge as freshness-driven (re-pin sequenced last). It is actually driven by BOTH gates in the self-check, and the spec-bridge half fires EARLIER — at the claim, before a single source file is edited. Every sweep task hits this at step 2 of the sweep loop, not at its first source-touching commit. The spec's problem statement covers this (R2 moves the whole self-check, both gates), but the phasing should know the spec-bridge half is the common case.

(2) TASK-104 and TASK-102 are more entangled than the board shows. TASK-104 (gate blind to branch-local spec dirs) is the direct cause of THIS instance. Moving the self-check out of the per-commit path (this card) fixes the wedge; TASK-104 fixes the false finding itself. Both still wanted — this card stops the blocking, TASK-104 stops the wrong answer.

Also observed: specs/051's TASK-101 row now reports 'ticked box over a red required gate' — a cascade of the same red 'tests' gate, not an independent defect. It clears when the suite is green.

Working state during this session: root tree kept green by leaving the status flip in place only while committing on the branch; no --no-verify used.

ASYMMETRY FINDING (2026-08-27, same session): the wedge fires at the ROOT, not in the worktree — and that is why it has felt intermittent.

Root:     416/1 (card says In Progress, specs/057 not on main)   -> BLOCKED
Worktree: 417/0 (spec dir present; backlog/ still at origin/main, so the card there
                  has no Spec marker yet and the pair is consistent)  -> passes

So under two-track landing (board commits direct to main, deliverables by PR) the board and the spec dir are deliberately in DIFFERENT places mid-task: the card flips on main, the spec lands on the branch. The self-check compares them from whichever checkout it runs in, so it sees a mismatched pair at root and a matched pair on the branch.

Consequences for spec 057:
- The claim commit for THIS card went through cleanly with hooks enabled and no --no-verify, because pre-commit ran in the worktree. That is luck of placement, not the wedge being absent — the root is red right now.
- The blocking surface that actually bites is the root: the Stop hook (stop-docs.mjs runs against the repo root) and any root-run 'node --test'.
- Phase 3's window computation must therefore be evaluated where the check RUNS, and must handle 'the board says In Progress but this checkout has no such spec dir' as the branch-local case TASK-104 describes — not as neglect.

This strengthens R2's argument: a check whose answer depends on WHICH CHECKOUT you run it from is definitionally repo-state, not a code-behavior test.
<!-- SECTION:NOTES:END -->
