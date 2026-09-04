# 059 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases — if the next
phase needs it, it is a ticked box, a committed slice, or a note in this dir.

## Phase 1 — The seam and the deterministic test

- [x] Read `team-review/scripts/run.mjs` (the `begin` branch, around line 55) and
      `test/team-review.test.mjs:206`; record in Notes the exact two `new Date()` sites that
      must agree today, and confirm the collision branch is
      `while (existsSync(runPath(id))) id += "x"`
- [x] Read `runGateCommand` in `spec-bridge/gates/bridge.mjs` for the house injection
      precedent (injected `spawn`, commented as a test double) and match its comment style —
      do not invent a new convention for injecting a dependency
- [x] Add the stamp seam to `team-review/scripts/run.mjs`: honour an override env var when
      present, otherwise return today's expression **verbatim**. Comment it as a test seam,
      NOT a user-facing knob — it must not appear in skill prose or docs
- [x] Rewrite `test/team-review.test.mjs:206`: delete the three-attempt retry loop, set the
      override to a fixed stamp, pre-write the colliding record for that stamp, run `begin`,
      and assert the id came back as `${expected}x`
- [x] Assert the collision-suffix branch is genuinely reached (AC #2) — a test that passes by
      no longer reaching it is a regression disguised as a fix
- [x] Add one assertion that with **no** override set, `begin` still produces today's id shape
      (AC #3)
- [x] `node --test` green with `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, and
      `test/phase-status.test.mjs` **unedited**
- [x] Commit

## Phase 2 — Prove it, bump, re-ground

- [x] Run the full suite **20 consecutive times**; all 20 must pass. Record the actual count
      and outcome in Notes — this is the artifact that proves the task (AC #4 / TASK-114 AC
      #3). Do not shorten the run and do not report fewer runs as if they were 20
- [x] Bump the marketplace version and `team-review`'s own skill `version:`
      (`team-review/` is released surface, `docs/releasing.md`); run
      `node scripts/sync-version.mjs`
- [x] Re-pin `docs/wiki/` via `node grounding-wiki/gates/cli.mjs plan . docs/wiki`; classify
      each pin **RE-PIN-ONLY** or **NEEDS-REVIEW** and amend prose BEFORE bumping where the
      diff could have invalidated it
- [x] Do NOT widen `spec-bridge-plugin.md`'s or `test-suite-catalog-plugins-gates.md`'s
      standing `size_budget_exempt` to absorb new prose — trim, split, or stop and report
- [x] All four gates green: `node --test`, `node scripts/check-docs.mjs`,
      `node scripts/sync-version.mjs --check`,
      `node grounding-wiki/gates/cli.mjs freshness . docs/wiki`
- [x] Commit

## Notes

(Implementers append findings here — decisions, reproductions, and the records the phases
above ask for. This section is the phase-to-phase handoff artifact; nothing rides chat.)

### Orchestrator (2026-09-01) — the confirmed mechanism

Recorded here so Phase 1 does not re-derive it. `test/team-review.test.mjs:206` computes
`stamp = new Date()…slice(0,19)`, pre-writes `${target}-${stamp}.json` as collision bait, then
**spawns** the CLI, which computes its own `stamp` at `team-review/scripts/run.mjs:55`. The
assertion at :222 (`assert.ok(collided, …)`) holds only if both land in the same second. A
second boundary crossed during spawn latency wastes the attempt; three retries all straddling
a boundary is rare when idle and likely under full-suite load. Matches every observation:
12/12 and 16/16 pass in isolation, intermittent in the full suite (measured 46.2s / 48.2s per
suite run on this host).

Three causes ruled out on 2026-09-01, so nobody re-derives them: **not** a gate timeout
(`GATE_TIMEOUT_MS` is 120000 vs a ~46s suite, and a timeout prints a different message than
`exited 1`); **not** the `SPEC_BRIDGE_GATE_ACTIVE` reentrancy guard (suite exits 0 with it
set, 468/468); **not** gate-message misattribution (`projectGateProblem`/`gateReason` name
whichever gate actually failed — the two observed runs simply hit two different real
failures, this flake and then the expected mid-PR wiki staleness).

### Phase 1 implementer (2026-09-01) — seam added, test rewritten, suite green

Confirmed the two sites that must agree: `test/team-review.test.mjs:206`'s
`stamp = new Date()…slice(0,19)` (the test's own second) and `team-review/scripts/run.mjs:55`'s
identical expression inside the spawned `begin` subprocess. Collision branch confirmed at
`run.mjs`: `while (existsSync(runPath(id))) id += "x"`. House precedent read from
`runGateCommand` (`spec-bridge/gates/bridge.mjs:169`) — an injected `spawn = spawnSync`
default, commented "injected so tests need no subprocess" — matched with an injected-env
seam commented the same way (test seam vs. user knob), since the CLI here crosses a process
boundary the way an env var, not a function param, can.

Change: `run.mjs` gained `const runStamp = () => process.env.TEAM_REVIEW_RUN_STAMP || new
Date()…slice(0,19)`, used at the one `begin` call site; the env var is commented as a test
seam only, not documented anywhere user-facing. `test/team-review.test.mjs`'s same-second
test now sets `env.TEAM_REVIEW_RUN_STAMP = "2026-01-01-00-00-00"`, pre-writes the colliding
record for exactly that stamp, and asserts the returned id equals `${expected}x` directly (no
loop, no `collided` flag) — the collision-suffix branch is reached by construction, not luck.
A new sibling test asserts that with `TEAM_REVIEW_RUN_STAMP` unset, `begin`'s id still matches
`^<target>-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}x*$` — pinning AC #3 (production shape
unchanged).

Verification: bare `node --test` (no path arg) → **469/469** (baseline 468 + the 1 new
AC #3-pinning test), 0 fail. `git diff --stat` on the three protected files
(`test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`, `test/phase-status.test.mjs`)
is empty — untouched. Ran `node --test test/team-review.test.mjs` in isolation 3x back to
back (17/17 each run) to sanity-check the rewritten test itself; did not attempt to
reproduce the original flake under full-suite load here — that load-dependent 20-run proof
is explicitly Phase 2's job (AC #4 / TASK-114 AC #3), not this implementer's.

No spec ambiguity requiring a judgment call outside the plan — the plan's Phase 1 steps
mapped directly onto the two files. Handoff to Phase 2: run the 20-consecutive-run proof,
bump the marketplace version + `team-review`'s skill `version:`, re-pin `docs/wiki/` for
`team-review/scripts/run.mjs` and `test/team-review.test.mjs` sources, and get all four
project gates green. This implementer touched only `team-review/scripts/run.mjs`,
`test/team-review.test.mjs`, and this `tasks.md` file — no version bump, no `docs/wiki/`
edit, per instructions.

### Phase 2 implementer (2026-09-01) — 20-run proof recorded

20 consecutive full-suite runs, each a fresh `node --test` process: **20/20 exited 0**; every
run reported `pass 469 / fail 0`; zero `not ok` / failure markers across the whole 20-run log;
the rewritten same-second run-lifecycle test (`test/team-review.test.mjs:206`) was present and
passing in all 20 runs. Log retained at
`/Users/evanstern/.claude/jobs/4b3aa81c/tmp/task114-20run.log`. AC #4 / TASK-114 AC #3 proven —
the flake is gone under the load condition that used to trigger it.

Version bump: marketplace 0.59.0 -> 0.59.1 (patch — internal test-determinism fix, no
user-facing behavior change per `docs/releasing.md`'s bump table); `team-review`'s own skill
`version:` 1.3.0 -> 1.3.1 (same reasoning, scoped to the one skill). `sync-version.mjs
0.59.1` ran clean; `--check` green afterward.

Re-pin ledger (`node grounding-wiki/gates/cli.mjs plan . docs/wiki`, 12 stale notes, pin
`ddd611deef8d7cb66fd73b7b383d51a460f74d14`):

- **RE-PIN-ONLY** (version-stamp diff only, no versions quoted in prose — re-pinned as-is):
  `build-plugin.md`, `codebase-to-course-plugin.md`, `educate-plugin.md`,
  `gates-consumption-surface.md`, `grounding-wiki-plugin.md`, `research-plugin.md`,
  `spec-bridge-plugin.md`.
- **NEEDS-REVIEW**, verified against the real diff before re-pinning:
  - `team-review-plugin.md` — prose quoted the skill version literally (`` `version: 1.3.0` ``
    at line 21); amended to `1.3.1`. The run-id/collision-suffix description (lines 44-55) is
    unaffected: `git diff` shows the new `TEAM_REVIEW_RUN_STAMP` seam is a test-only env
    override, production path (`new Date()` default) byte-identical per R3 — no other prose
    change needed.
  - `build-and-release.md`, `pdlc-plugin.md`, `reorient-plugin.md` — each quotes version
    literals (`0.3.0`, `v0.2.0`/`0.5.0`, `0.23.0`/`0.26.0`/`0.53.0`/`0.10.0`,
    `0.5.0`/`0.2.0` respectively), but every one is a historical example, a "since"
    feature-introduction marker, or a different skill's own version — none references the
    marketplace version that just moved from 0.59.0 to 0.59.1. Verified by reading each cited
    line in context; no prose change needed.
  - `test-suite-catalog-plugins-gates.md` — lists `test/team-review.test.mjs` as a source
    (this branch's Phase 1 rewrote 25/-14 lines of it). Read the diff and the note's bullet
    (line 108-112): it describes behavior (`begin`/`finish`/`abandon`, id collisions,
    self-review regressions) at the level the rewrite didn't change, and quotes no test
    count. No prose change needed — the prior preliminary read-only finding is confirmed, not
    just trusted.

Over-budget notes: `spec-bridge-plugin.md` (8445/8000, TASK-104 exemption) and
`test-suite-catalog-plugins-gates.md` (8231/8000, TASK-103 exemption) were both re-pinned
without touching `size_budget_exempt` or adding prose — the freshness gate still reports both
as `warn` (non-blocking) at unchanged sizes.

All four gates green: `node --test` → 469/469 pass, 0 fail, exit 0; `node
scripts/check-docs.mjs` → exit 0; `node scripts/sync-version.mjs --check` → exit 0; `node
grounding-wiki/gates/cli.mjs freshness . docs/wiki` → exit 0 (2 pre-existing warn-only
exemptions, 40 notes fresh).
