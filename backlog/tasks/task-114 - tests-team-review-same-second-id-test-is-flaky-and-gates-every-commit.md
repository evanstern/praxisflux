---
id: TASK-114
title: 'tests: team-review same-second id test is flaky and gates every commit'
status: To Do
assignee: []
created_date: '2026-08-28 18:30'
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
