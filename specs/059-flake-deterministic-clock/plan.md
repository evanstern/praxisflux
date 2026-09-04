# 059 — plan

## Constitution check

**No ratified constitution exists on this host** (`.specify/` is absent; Spec Kit is not
installed — this spec dir is hand-authored under the sweep runbook's operator-signed escape
line). So this plan is checked against the project's grounding docs instead:
`CLAUDE.md`'s PDLC block, `docs/principles.md`, and `docs/skill-patterns.md`.

Relevant standing rules and how this plan satisfies them:

- **Artifact-grounded action.** The defect mechanism was read out of the code, not inferred,
  and is recorded on TASK-114 plus in `spec.md` above with the measured evidence (isolation
  12/12 and 16/16 pass; full-suite intermittent; suite duration 46.2s / 48.2s on this host).
- **One TASK, one PR.** TASK-114 is a top-level TASK, so it gets its own branch
  (`task-114-flake-fix`) and its own PR — not commits on TASK-110's or TASK-111's branch,
  even though all three develop in parallel in the same lane.
- **Released surface ⇒ version bump.** `team-review/` is a plugin dir, so the PR must bump the
  marketplace version and `team-review`'s own skill `version:` per `docs/releasing.md`.
- **Gates.** Status may not exceed proven artifacts; the 20-run proof (AC #4) is the artifact
  that proves this one, and it is the whole point of the task.

## Approach

The test races a real clock because two processes each call `new Date()` and the test needs
them to land in the same second. Remove the race by letting the **test** decide the stamp.

Follow the repo's existing injection precedent rather than inventing one:

| Existing | Injected thing |
|---|---|
| `runGateCommand(command, { spawn })` in `spec-bridge/gates/bridge.mjs` | the spawner |
| `mirrorStaleness(root, mirror, { headSha })` in `lib/board-mirror.mjs` | the git ref |
| **this change** | the run-id stamp |

`team-review/scripts/run.mjs:55` currently reads:

```js
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
```

The CLI is spawned as a subprocess by the test, so the injection seam has to cross a process
boundary — an env var is the only seam that does, and it is the same shape the tests already
use for `scratchHome()`'s env. Default stays exactly `new Date()`, so production ids are
byte-identical (R3).

## Steps

### Phase 1 — the seam and the deterministic test

1. `team-review/scripts/run.mjs`: extract the stamp into a tiny helper that honours an
   override env var when present and otherwise returns today's expression verbatim. Comment it
   as a **test seam, not a user-facing knob** (R3) — the same way `runGateCommand`'s injected
   `spawn` is commented.
2. `test/team-review.test.mjs:206`: delete the three-attempt retry loop. Set the override to a
   fixed stamp, pre-write the colliding record for exactly that stamp, run `begin`, and assert
   the returned id is `${expected}x` — the collision-suffix branch, now reached by
   construction (R1, R4).
3. Add one assertion that with **no** override set, `begin` still produces an id matching
   today's shape (R3, AC #3).
4. Bare `node --test` green; the three protected test files untouched.
5. Commit.

### Phase 2 — prove it, bump, re-ground

6. Run the full suite **20 consecutive times**; all 20 must pass (AC #4, TASK-114 AC #3).
   Record the run count and outcome in `tasks.md`'s Notes — this is the artifact that proves
   the task, so a summary sentence is not enough.
7. Bump the marketplace version and `team-review`'s skill `version:`; run
   `node scripts/sync-version.mjs`.
8. Re-pin every `docs/wiki/` note listing a touched file as a source. Use
   `node grounding-wiki/gates/cli.mjs plan . docs/wiki` and classify each pin
   **RE-PIN-ONLY** or **NEEDS-REVIEW**; amend prose before bumping where the diff could have
   invalidated it. A merge-in never justifies a pin bump.
9. All four gates green: `node --test`, `node scripts/check-docs.mjs`,
   `node scripts/sync-version.mjs --check`,
   `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`.
10. Commit.

## Risks

- **The fix could hide the bug it tests.** If the override made `begin` skip the collision
  branch, the test would pass while proving nothing. R4/AC #2 exists for exactly this: the
  test must assert the `x` suffix came back, not merely that no error occurred.
- **20 runs is ~15 minutes** at ~46s per run. That is the cost of the proof and is expected;
  do not shorten it to save time, and do not report fewer runs as if they were 20.
- **A version bump stales ~12 wiki notes** (every note pinning a `plugin.json`). Budgeted for
  in Phase 2, and two notes are already over budget on standing exemptions
  (`spec-bridge-plugin.md`, `test-suite-catalog-plugins-gates.md`) — do not widen either to
  absorb new prose.
