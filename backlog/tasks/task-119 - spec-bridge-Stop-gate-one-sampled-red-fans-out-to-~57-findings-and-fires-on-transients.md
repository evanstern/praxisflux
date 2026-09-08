---
id: TASK-119
title: >-
  spec-bridge Stop gate: one sampled red fans out to ~57 findings, and fires on
  transients
status: To Do
assignee: []
created_date: '2026-09-08 15:35'
labels:
  - tech-debt
  - spec-bridge
  - gates
dependencies: []
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The spec-bridge Stop hook fired five times during one task (TASK-116, 2026-09-08), each time emitting ~57 near-identical findings — one per Done-eligible spec — all downstream of a SINGLE red `tests` gate. Every firing cost real diagnosis time. Four causes were identified; one was never reproduced.

**Two distinct problems.**

**1. Fan-out.** One red project gate produces one finding PER linked Done-eligible spec (~57 here, and it grows with the spec count). The findings are indistinguishable from each other and none names the actual cause. The signal "your test suite is red" arrives as 57 lines about ticked checkboxes in specs 001–059, most of them merged months ago and none of them at fault. A single "the `tests` gate is red — N ticked phases are affected" would carry the same information.

**2. Transient sampling.** The gate runs `node --test` at Stop time against whatever the tree happens to be. Observed causes across the five firings:
   - **Rounds 1, 2, 4:** sampled a worktree holding an implementer's UNCOMMITTED mid-dispatch edits. The commit was fine; the sample was not. This is the mirror image of the repo's own F6 finding ("a gate run against a dirty working tree proves nothing about the commit") — here it produced a false RED rather than a false green.
   - **Round 3:** a genuine test failure (spec 054's sentinel guard vs spec 060's new field). Correctly reported, and the only firing that was real.
   - **Round 5:** NOT REPRODUCIBLE. Both trees clean, root suite exit 0, `gate.sh` run manually from root AND from the worktree gave 0 findings, a concurrent-run test gave 0 findings, no stray root files, and CI passed. No explanation found. Recorded as unexplained rather than guessed at.

The ratio matters: one of five firings was actionable. A gate that cries wolf four times in five trains its reader to skip it, which is exactly the opposite of what "status can't exceed proven artifacts" is for.

Suggested directions (not decided): collapse the fan-out to one finding per red gate; skip or explicitly label the project-gate run when the working tree is dirty (a dirty tree cannot prove anything about a commit); and consider whether the Stop hook is the right place to run a ~45-second full suite at all.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A single red project gate produces ONE finding naming that gate, not one per linked spec
- [ ] #2 The project-gate run either skips or explicitly labels its verdict when the working tree is dirty, so a mid-dispatch sample cannot read as a real failure
- [ ] #3 Regression test: a red gate plus N Done-eligible specs yields one finding, not N; and a dirty tree yields a labeled/skipped verdict rather than a bare red
- [ ] #4 The unexplained round-5 firing is either reproduced and explained, or explicitly recorded as unreproduced with what was ruled out
<!-- AC:END -->
