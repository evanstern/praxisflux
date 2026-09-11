---
id: TASK-0132
title: >-
  CI runs the full test suite twice per PR — the tests job, then again as
  spec-bridge's tests project gate
status: To Do
assignee: []
created_date: '2026-09-11 16:05'
labels:
  - ci
  - cost
  - debt
  - flake
dependencies: []
priority: medium
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.spec-bridge.json`'s `projectGates.required` includes `{ "name": "tests", "command": ["node","--test"] }`, so the `checks` job's spec-bridge step re-runs the ENTIRE suite that the separate `tests` job in the same CI run just finished. Two full runs per PR, ~14s each at 624 tests.

The cost is minor; the correctness consequence is not. **It is a second independent roll of the dice on any nondeterministic test.** That is exactly how the TASK-0130 flake (~5% per run) blocked PR #144: the `tests` job passed 624/624 while the `tests` project gate, rolling the same die again in the same run, came up red. A ~5% flake becomes ~10% per PR, and the failure surfaces in the *less* diagnosable of the two places (see TASK-0131).

WHY THE GATE ENTRY EXISTS AT ALL — do not just delete it: the `projectGates` mechanism enforces "a ticked tasks.md checkbox cannot outrun a red project gate", which is load-bearing doctrine and works correctly. The problem is the redundant INVOCATION in CI specifically, where a dedicated `tests` job already proves the same fact. Locally (Stop hook, pre-commit) there is no sibling job, so the gate entry is the only thing proving it — the fix must not disarm that.

Directions worth weighing, not a decided design:

- Have the CI spec-bridge step reuse the `tests` job's verdict rather than re-running (job dependency + status, or a marker the gate can read).
- Let `projectGates` entries declare that a gate is already satisfied by a sibling CI job, honored only when a CI env var is set.
- Order the jobs so a red `tests` short-circuits the `checks` job.

Whatever the shape: locally nothing may be weakened, and the doctrine the mechanism enforces must survive intact.

Related: TASK-0130 (the flake itself), TASK-0131 (the swallowed diagnostics that made this hard to see). Also worth noting CI has no retry and no flake quarantine, so any nondeterministic test blocks every PR at random — in scope to consider here, but only as it bears on the double-run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The full test suite runs ONCE per CI run, not twice — measured from the workflow logs, not assumed
- [ ] #2 The 'a ticked checkbox cannot outrun a red project gate' enforcement still holds in CI: a genuinely red suite still fails the spec-bridge gate (proven by a deliberate red-suite run, not reasoned)
- [ ] #3 Local invocation paths (Stop hook, pre-commit, hand-run) are UNCHANGED — there is no sibling job there, so the gate entry stays the only proof and nothing is weakened
- [ ] #4 The chosen mechanism is data the host states in config, not behavior inferred from ambient env sniffing — consistent with how projectGates and statusVocabulary already work
- [ ] #5 docs/consuming-gates.md (or the equivalent consumer contract doc) records the behavior change if the projectGates contract is extended
<!-- AC:END -->
