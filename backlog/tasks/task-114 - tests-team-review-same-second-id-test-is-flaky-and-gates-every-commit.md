---
id: TASK-114
title: 'tests: team-review same-second id test is flaky and gates every commit'
status: To Do
assignee: []
created_date: '2026-08-28 18:30'
updated_date: '2026-09-01 14:12'
labels:
  - tests
  - debt
  - flake
dependencies: []
ordinal: 146000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`test/team-review.test.mjs:206` — "a same-second begin never overwrites — ids stay distinct" — fails intermittently in full-suite runs.

Observed 2026-08-28 during TASK-104 (spec 058): a dispatched implementer hit it on two consecutive full-suite runs (442/443), while the same file passed 16/16 in isolation and the pre-commit hook's own full-suite run passed clean. A follow-up probe ran the file 12x in isolation: 12 pass / 0 fail. Two independent full-suite runs afterwards: 443/443 green both times.

So it is rare, real, and load-bearing in the wrong way: the suite is the gate that blocks every commit on this repo (`core.hooksPath` + `.githooks/pre-commit` run the full suite), and it is also what the spec-bridge project-gate check consults before allowing a ticked tasks.md box. A test that fails a few percent of the time therefore randomly blocks commits and randomly reports honest board state as dishonest.

The test appears to be a probabilistic collision-retry: it asserts distinct ids across attempts within the same second. Likely fix is to make id generation deterministic under test (inject a counter/clock) rather than retrying and hoping — but the actual mechanism should be read before choosing.

Unrelated to spec 058, which touches only lib/spec-source.mjs and lib/spec-derive.mjs. Carded rather than fixed in-scope, per the sweep's scope-discipline rule.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The intermittent failure at test/team-review.test.mjs:206 is reproduced or its mechanism explained from the code
- [ ] #2 Id generation under test is made deterministic (or the assertion made non-probabilistic) so the test cannot fail by chance
- [ ] #3 The full suite passes across at least 20 consecutive runs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MECHANISM CONFIRMED from the code (2026-09-01, orchestrator; AC#1 evidence). test/team-review.test.mjs:206-223 computes stamp = new Date() truncated to the second, pre-writes a record for that stamp, then SPAWNS the CLI as a subprocess and asserts the id came back with the collision suffix ('x'). The assertion at :222 — assert.ok(collided, 'collision suffix path never exercised across 3 attempts') — holds only if the subprocess computes the SAME second the test did. If the wall clock crosses a second boundary during spawn latency, no collision occurs and that attempt is wasted. It retries 3x, so failure needs all three attempts to straddle a boundary — rare when the machine is idle, much likelier under a loaded full-suite run where spawn latency is both larger and more variable. That matches every observation: 12/12 and 16/16 pass in ISOLATION (fast spawns, boundary rarely crossed), intermittent failure only in FULL-SUITE runs. Measured suite duration on this host: 46.2s / 48.2s / ~45s, i.e. sustained load throughout. So AC#2's 'make it deterministic rather than retrying and hoping' is the right fix and the retry loop is the thing to remove: inject the clock (or the stamp) into the CLI under test so the test controls the second, instead of racing a real one. NOTE the blast radius is wider than 'a flaky test': the full suite is the 'tests' project gate the spec-bridge Stop hook consults, and a Done-eligible board amplifies ONE red gate into ~50 findings (one per Done-eligible spec) — observed 2026-08-28 (TASK-102) and again 2026-09-01 during TASK-109, where 55 findings all read 'the required gate "tests" is red (exited 1)'. Ruled out as causes on 2026-09-01, so a future session need not re-derive them: (1) NOT a gate-timeout — GATE_TIMEOUT_MS is 120000 and a single suite run is ~46s, and a timeout would have printed 'timed out after 120000ms', not 'exited 1'; (2) NOT the SPEC_BRIDGE_GATE_ACTIVE reentrancy guard — the suite exits 0 with 468/468 with that env var set; (3) NOT gate misattribution in the message builder — projectGateProblem/gateReason name whichever gate actually failed, and the two runs simply saw two different real failures (the flake first, then the expected mid-PR wiki-freshness staleness).
<!-- SECTION:NOTES:END -->
