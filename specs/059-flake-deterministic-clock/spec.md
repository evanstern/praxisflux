# 059 — spec: make the same-second run-id test deterministic

## Problem

`test/team-review.test.mjs:206` — "run lifecycle: a same-second begin never overwrites — ids
stay distinct" — fails intermittently. It is not a bad assertion about the product; the
product behaviour it checks is correct and worth checking. The test's *setup* races a real
clock.

The mechanism, confirmed from the code (2026-09-01):

```
test:              stamp = new Date()… .slice(0,19)     ← the test's second
test:              writeFileSync(`${target}-${stamp}.json`)   ← collision bait
test:              cli(env, home, "begin", target)      ← SPAWNS a subprocess
team-review/scripts/run.mjs:55:  stamp = new Date()…    ← the subprocess's OWN second
```

If the wall clock crosses a second boundary between those two `new Date()` calls, the
subprocess computes a different stamp, no collision occurs, and the attempt is wasted. The
test retries three times (`for attempt < 3 && !collided`) and then asserts
`assert.ok(collided, "collision suffix path never exercised across 3 attempts")`. Failure
requires all three attempts to straddle a boundary — rare on an idle machine, likely under a
loaded full-suite run where subprocess spawn latency is both larger and more variable.

That predicts every observation on record:

| Condition | Result |
|---|---|
| The file run in isolation, 12× and 16× | pass, 0 fail |
| Full suite (~46s sustained load, measured 46.2s / 48.2s on this host) | intermittent |

## Why this is worth a task rather than a shrug

The full suite is the **`tests` project gate** the spec-bridge Stop hook consults before
allowing a ticked `tasks.md` box. On a board with many Done-eligible specs, **one** red gate
is amplified into one finding per Done-eligible spec — ~50 findings observed 2026-08-28
(TASK-102), and 55 observed 2026-09-01 during TASK-109, every one of them reading
`the required gate "tests" is red (exited 1)`.

So a test that fails a few percent of the time does two expensive things: it randomly blocks
every commit (`core.hooksPath` + `.githooks/pre-commit` run the full suite), and it randomly
reports honest board state as dishonest. It also trains `--no-verify`, which is the failure
mode TASK-100/93 already recorded.

## Requirements

**R1 — the test must not be able to fail by chance.** The second the subprocess stamps must
be the second the test expects, by construction rather than by timing luck. The
three-attempt retry loop is the thing to remove: retrying a race makes failure rarer, not
impossible, and a rarer flake is harder to diagnose, not better.

**R2 — injection follows this repo's existing precedent, not a new convention.**
`runGateCommand` in `spec-bridge/gates/bridge.mjs` already takes an injected `spawn` so tests
need no subprocess; `mirrorStaleness` takes an injected `headSha`. The same idea applies:
`team-review/scripts/run.mjs` should read its stamp from an overridable source, defaulting to
`new Date()` exactly as today.

**R3 — production behaviour is unchanged.** With no override present, `begin` must produce
byte-identical ids to today. The override exists for tests; it is not a feature, and it must
not appear in skill prose or docs as a user-facing knob.

**R4 — the collision path must still be genuinely exercised.** The point of the test is the
`while (existsSync(runPath(id))) id += "x"` branch. A rewrite that makes the test pass by no
longer reaching that branch is a regression disguised as a fix.

**R5 — no new dependency, no new module.** This is a small change to one script and one test.

## Non-goals

- Changing how run ids are shaped, or their collision-suffix strategy.
- Touching any other test in `test/team-review.test.mjs`.
- Any `docs/wiki/` note rewrite beyond the re-pin the change obliges.

## Acceptance criteria

1. `test/team-review.test.mjs:206`'s retry loop is gone; the test controls the stamp and
   cannot fail because of clock timing.
2. The collision-suffix branch in `team-review/scripts/run.mjs` is still exercised by that
   test — asserted, not assumed.
3. With no override set, `begin` produces the same id shape as today (a test pins this).
4. The full suite passes across **20 consecutive runs** (TASK-114 AC #3).
5. The three protected test files (`test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`,
   `test/phase-status.test.mjs`) remain byte-identical.
6. `docs/wiki/` re-pinned for every note listing a touched file as a source; version bumped
   (`team-review/` is released surface); all four project gates green.
