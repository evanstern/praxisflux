# 053 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Precondition:** spec 052 is merged. `lib/board-mirror.mjs` exists with `readMirror`,
`mirrorStaleness`, and `providers`.

## Phase 1 — The seam and root resolution (behavior must not change)

- [x] Read `spec-bridge/gates/bridge.mjs`, `spec-bridge/gates/cli.mjs`,
      `lib/project-root.mjs`, and `lib/gate-runner.mjs`; record in Notes every root-resolution
      site and how the runner handles a gate function that throws
- [x] Implement `boardLinks(root)` with R1's three-step order — **mirror first**, live
      Backlog projection second, `[]` third — and comment why mirror-first (otherwise an
      adopted mirror is never exercised and 052's drift check guards a file nothing reads)
- [x] Replace the `findLinkedTasks` call in `checkBridge` with `boardLinks`; run `node --test`
- [x] Replace it in `verifyBridge`; run `node --test`
- [x] Replace it in `planBridge`; run `node --test`
- [x] Add `hasAnyChild(...names)` to `lib/project-root.mjs` (one definition, composed from
      `hasChild`)
- [x] Update `bridgeGate.resolveRoots` to `hasAnyChild(".board", "backlog")`
- [x] Update `spec-bridge/gates/cli.mjs`'s `findRootUpwards` predicate in lockstep — the hook
      and the CLI must never disagree about what a project is
- [x] Test AC #4: `.board`-only, `backlog`-only, and both-present roots resolve under **both**
      resolvers
- [x] `node --test` green with `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`,
      `test/phase-status.test.mjs` **unedited**
- [x] Commit

## Phase 2 — The fail-closed findings (new behavior, isolated)

- [x] Implement R3: `checkBridge` runs `mirrorStaleness`; a stale `requiresSync: true` mirror
      emits exactly one blocking problem naming the reason **and** the remedy
      (`run the board:sync skill`)
- [x] Implement R3's asymmetry: a stale `requiresSync: false` mirror emits **no** staleness
      problem, and carry the reason in a code comment — same word, different consequence,
      or a future reader "fixes" it
- [x] Implement R4: a declared `requiresSync: true` provider with an absent
      `.board/links.json` emits the blocking "no board evidence" problem
- [x] Read `.board.json` if present; treat its absence as `provider = "backlog"` so this
      spec lands and tests before 054 merges
- [x] Tests for ACs 5, 6, 7 — assert on **message content**, not just problem count, so the
      fail-closed path can never be mistaken for an empty board
- [x] Confirm a throwing `readMirror` surfaces through `lib/gate-runner.mjs` as a blocking
      problem rather than crashing the Stop hook; record how you verified it
- [x] Commit

## Phase 3 — Planner split, differential proof, re-ground

- [ ] Split `planLinkedTask` into `planIntents(task, derived, profile)` and
      `renderBacklog(id, intents)`; **all ordering logic stays in `planIntents`** (removals
      highest-index-first, check/uncheck at post-edit indexes — reconciliation, not rendering)
- [ ] `planBridge` for `backlog` returns today's exact command strings; for any other
      provider returns intents plus the stated notice (AC #8)
- [ ] Run the planner tests — they compare exact command strings and must pass **unedited**;
      a failure means the split moved logic across the line
- [ ] **Differential test (AC #3):** build two temp projects with equivalent board state —
      one `backlog/tasks/*.md`, one `.board/links.json` — against the same spec dirs, and
      assert `problems` and `warnings` are **equal**. This tests the equivalence the design
      claims, which single-path assertions cannot
- [ ] Bump the marketplace version (`spec-bridge/`, `lib/` are released surface); run
      `node scripts/sync-version.mjs`
- [ ] Bump `spec-bridge`'s edited skill `version:` if any SKILL.md changed
      (`docs/releasing.md` requires it per-skill)
- [ ] Re-pin `docs/wiki/` notes whose `sources:` this touches — at minimum
      `spec-bridge-plugin`, `gates-convention`, `project-root`; classify each
      **RE-PIN-ONLY** or **NEEDS-REVIEW** and amend prose before bumping where needed
- [ ] All four project gates green: `node --test`, `check-docs.mjs`,
      `sync-version.mjs --check`, freshness
- [ ] Commit

## Notes

### Phase 1 (implemented on `task-110-bridge-on-mirror`)

**Root-resolution inventory** (all line numbers re-verified against this branch before
implementing; all matched the pre-verified grounding handed into this dispatch):

1. `spec-bridge/gates/bridge.mjs:525` (pre-edit) —
   `bridgeGate.resolveRoots: (startDir) => findRootsDownwards(startDir, hasChild("backlog"))`
   — the Stop-hook entry point, reached via `lib/gate-runner.mjs`'s `evaluate()`. Now (post-edit)
   `hasAnyChild(".board", "backlog")`.
2. `spec-bridge/gates/cli.mjs:27` (pre-edit) —
   `findRootUpwards(resolve(target), hasChild("backlog"))` — used **only** by the `state`
   subcommand, to resolve `.spec-bridge.json`'s root for `requireAnalysis`. `links` / `check` /
   `verify` / `plan` take `target` as the root directly; no resolution happens there. Now
   (post-edit) `hasAnyChild(".board", "backlog")`, updated in lockstep with (1).
3. `lib/project-root.mjs` defined `hasChild`, `findRootUpwards`, `findRootsDownwards` and had
   **no** `hasAnyChild`. Added it as one definition: `hasAnyChild(...names) => (dir) =>
   names.some((n) => hasChild(n)(dir))` — composes into both (1) and (2) since both finders take
   the same `markerFn: (dir) => boolean` shape.
4. `lib/gate-runner.mjs`: `evaluate()` wraps both `gate.resolveRoots` (line 48) and `gate.check`
   (lines 52-54) in try/catch, pushing `[<gate>] … crashed on <root>: <msg>` into **problems**
   (blocking) — confirmed by reading the code and by the two existing regression tests in
   `test/chassis.test.mjs` ("gate-runner: additive evaluate…" and "a crashing resolveRoots
   surfaces as a blocking problem"). Line 56: `warn()` failures are caught and swallowed —
   best-effort, never a problem. So any Phase 2 fail-closed finding (stale/absent mirror) MUST
   land in `checkBridge`'s `problems` (surfaced via `check`), never only in `warnings`, or a
   `warn()` failure mode would silently drop it.

**What was implemented:**
- `boardLinks(root)` added to `spec-bridge/gates/bridge.mjs` (placed right after the
  `parseLinkedTask`/`findLinkedTasks` re-export, before `verdict`): mirror first
  (`readMirror(root)` — its throw on malformed/unknown-schema is left to propagate, so
  gate-runner surfaces it per point 4 above), live `providers.backlog.project(root)` second
  (gated on `existsSync(join(root, "backlog", "tasks"))`), `[]` third. Comment states the
  mirror-first rationale (an adopted mirror must be exercised, not bypassed by a live rescan,
  or 052's `--check` drift detection would guard a file nothing reads).
- `checkBridge`, `verifyBridge`, `planBridge` each had their sole
  `for (const task of findLinkedTasks(root))` swapped for `boardLinks(root)` — no other line in
  any of the three changed. `findLinkedTasks` itself is untouched and still re-exported (several
  tests, e.g. `test/spec-bridge.test.mjs`, import and call it directly).
- `hasAnyChild(...names)` added to `lib/project-root.mjs` immediately after `hasChild`.
- `bridgeGate.resolveRoots` and `cli.mjs`'s `state`-command root resolution both now use
  `hasAnyChild(".board", "backlog")` — one definition, two call sites, updated together in the
  same commit.
- New test file `test/board-provider-seam.test.mjs` (not one of the three protected files):
  one unit test for `hasAnyChild`, plus a parametrized test over the three layouts
  (`.board`-only, `backlog`-only, both) asserting `bridgeGate.resolveRoots` returns the root
  AND that `node cli.mjs state <specDir>` (spawned as a real subprocess, since cli.mjs is a
  script, not an importable function) picks up `.spec-bridge.json`'s `strictDone` — observable
  via `analysis.required` flipping `true` only when the root actually resolved. This is AC #4.

**Verification:** `node --test` (bare, no path arg) → 472/472 (468 baseline + 4 new), 0 fail.
`git diff --stat` confirms `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`,
`test/phase-status.test.mjs` are byte-identical to the baseline (empty diff).

**Spec ambiguity / choice made:** none rose to the level of needing a stop-and-report. The one
judgment call: where to put the AC #4 coverage. tasks.md didn't name a file; `hasAnyChild`'s own
unit test fits `test/chassis.test.mjs`'s existing `project-root:` test pattern, but proving the
hook and the CLI *agree* needs `bridgeGate` plus a real `cli.mjs` subprocess, which is
spec-bridge-shaped, not chassis-shaped — so it went into a new sibling file,
`test/board-provider-seam.test.mjs`, named after the design doc / this spec's slug. tasks.md
Phase 3 already anticipates "or a sibling" for board-mirror coverage; this reuses that
allowance one phase early, for the root-resolution half of the seam.

**For Phase 2:** `boardLinks` currently returns `[]` when there's no mirror and no
`backlog/tasks` — Phase 2's R3/R4 fail-closed findings (stale mirror, declared-but-missing
mirror) will need to run inside `checkBridge` *before or alongside* the `boardLinks(root)` call,
since `boardLinks` itself has no way to signal "the mirror is stale" vs "the mirror is absent by
design" — those are `checkBridge`-level concerns per R3/R4's wording, not `boardLinks`'
resolution-order concern. `readMirror(root)` will need to be called again (or its result
threaded through) in `checkBridge` to feed `mirrorStaleness` — currently `boardLinks` calls
`readMirror` once internally, so Phase 2 either duplicates that read (cheap, it's local fs) or
takes `boardLinks` as `(root) => { mirror, links }` — that's a Phase 2 judgment call, not
pre-decided here, since Phase 1's AC #2 requires `boardLinks(root)`'s existing signature (a
links array) to stay exactly what the three call sites already consume unchanged.

### Phase 2 (implemented on `task-110-bridge-on-mirror`)

**Judgment call carried over from Phase 1's note, now made:** `checkBridge` re-reads
`readMirror(root)` itself (a second, cheap local-fs read — `boardLinks(root)` already reads it
once internally for R1's resolution order) rather than changing `boardLinks`'s return shape.
This keeps Phase 1's AC #1/#2 signature untouched and confines all Phase 2 logic to
`checkBridge`, where R3/R4 belong per the spec's own wording ("`checkBridge` runs
`mirrorStaleness`").

**What was implemented, in `spec-bridge/gates/bridge.mjs`:**
- `mirrorStaleness` added to the existing `lib/board-mirror.mjs` import (that module is
  consumed, not modified, per the dispatch's scope).
- `declaredProvider(root)` (unexported, internal to `bridge.mjs`): reads `.board.json`
  defensively — absent, unreadable, or malformed all collapse to `"backlog"` — so this spec
  lands and is tested before spec 054 (which owns `.board.json`) merges. Does **not** import
  anything from the sibling TASK-111 branch building `loadBoardConfig`; this is a small,
  independent, throwaway reader scoped to exactly what R4 needs.
- Inside `checkBridge`, before the per-task loop (a project-level check, not a per-task one):
  a fresh `readMirror(root)` call, then:
  - **mirror present (R3):** provider is read from **the mirror's own `provider` field**
    (`providers[mirror.provider]`, unknown name fails closed to `requiresSync: true` — same
    fallback `mirrorStaleness` itself uses). If `requiresSync`, call `mirrorStaleness(root,
    mirror)` and push one blocking problem when stale. If **not** `requiresSync`, skip the
    call entirely — the asymmetry is enforced by never asking, not by asking and discarding
    the answer, which is the more literal reading of "the live projection is preferred" and
    keeps the two branches visibly asymmetric in the code (comment at the `if (mirror)` block
    states this explicitly, per the spec's ask to "carry the reason in a code comment").
  - **mirror absent (R4):** provider comes from **`.board.json`'s declaration**
    (`declaredProvider(root)`, defaulting to `"backlog"`), not from the mirror (there isn't
    one). If that declared provider's `requiresSync` is true, push the blocking "no board
    evidence" problem.
  - This is a deliberate split of "which provider" by which artifact is actually present: R3's
    provider always comes from the mirror that exists; R4's always comes from the config that
    says one *should* exist. Conflating them (e.g. always trusting `.board.json` even when a
    mirror is on disk) would let a stale `.board.json` override live mirror evidence — worth
    naming here since a future reader may otherwise "simplify" the two branches into one.
- `verifyBridge` and `planBridge` are **untouched** — R3/R4 name `checkBridge` specifically
  (the Stop-hook `check` path); the spec's own AC list (5–7) is phrased in terms of what
  `checkBridge` yields.

**Exact message strings emitted (asserted on content in the new tests, not just count):**
- R3 (stale, `requiresSync: true`):
  `` `[spec-bridge] board mirror is stale (${reason}) — run the board:sync skill to refresh .board/links.json before claiming status.` ``
  where `${reason}` is `mirrorStaleness`'s own reason string (e.g. `TASK-1: no observedSha on
  requiresSync provider "jira"`, or `TASK-1: observedSha <sha> is not an ancestor of HEAD`) —
  reused verbatim rather than restated, so the two layers can never drift apart.
- R4 (absent mirror, declared `requiresSync: true`):
  `` `[spec-bridge] provider "${provider}" is declared but .board/links.json is missing — the gate has no board evidence to check. Run the board:sync skill.` ``

**Tests added** (`test/board-provider-seam.test.mjs`, not one of the three protected files):
five new tests — AC #5 (stale `requiresSync:true` → exactly one problem, asserted against
four separate substrings: "stale", "no observedSha", "run the board:sync skill",
".board/links.json"), AC #6 (stale `requiresSync:false`, seeded with an unverifiable
`observedSha` on a non-git root so `mirrorStaleness` itself *would* call it stale → zero
problems, proving the asymmetry is enforced, not merely untested), AC #7 (declared
`requiresSync:true`, absent mirror → exactly one problem, asserted against four substrings),
a backward-compat regression (no `.board.json`, no mirror → zero R3/R4 problems, i.e. the
`"backlog"` default costs nothing), and the DoD #6 throw-surfacing test below. Every fixture
gives its one linked task a non-standard `status: "Custom"` so the per-task verdict is
`"unknown"` (no exceeds/lags noise) — isolating each assertion to exactly the R3/R4 finding
under test, not an accidental co-occurrence with an unrelated verdict problem.

**DoD #6 — how the throwing-`readMirror` path was verified (not just asserted):** wrote a
new end-to-end test, `"gate-runner: a malformed mirror's readMirror throw surfaces as a
blocking problem, not a crash"`, that (a) writes a real syntactically-invalid
`.board/links.json` to a real temp directory, (b) calls the **real** `bridgeGate` (imported
from `spec-bridge/gates/bridge.mjs`, unmocked) through the **real** `evaluate()` (imported
from `lib/gate-runner.mjs`, unmocked) — no stub of either the gate or the runner — and (c)
asserts `verdict.block === true` and the message matches
`/\[spec-bridge\] crashed on .*: .*malformed JSON/`. This exercises the full path a live Stop
hook would take: `evaluate` → `bridgeGate.resolveRoots` (finds the temp root via `.board`) →
`bridgeGate.check` → `checkBridge` → `readMirror` throws → the throw propagates up through
every one of those frames uncaught → `gate-runner.mjs`'s `try/catch` around `gate.check`
(`lib/gate-runner.mjs` lines 52-54) catches it and pushes `[<gate.name>] crashed on <root>:
<msg>` into `problems`. Ran with `node --test`; the test passed (see run below) — the process
did not crash, and the finding rendered as a normal blocking problem string. This is the same
generic mechanism `test/chassis.test.mjs`'s pre-existing "a crashing resolveRoots/check
surfaces as a blocking problem" tests cover with synthetic gates; this test proves the
*specific* integration — this spec's actual gate, this spec's actual failure mode (a
malformed mirror), through the real runner — rather than relying on the generic case as
proof by analogy.

**Verification:** `node --test` (bare, no path arg) → **477/477**, 0 fail (472 Phase-1
baseline + 5 new). `git diff --stat` confirms `test/spec-bridge.test.mjs`,
`test/project-gates.test.mjs`, `test/phase-status.test.mjs` are byte-identical to the
Phase-1 baseline (empty diff) — AC #9 holds.

**Spec ambiguity / choices made:**
1. Where the "provider" comes from differs by branch (R3: the mirror's own field; R4: the
   `.board.json` declaration) — see above; this follows directly from which artifact is
   actually present in each branch, not an arbitrary pick.
2. R3's message reuses `mirrorStaleness`'s reason string verbatim rather than composing a new
   sentence from its parts. The spec's illustrative example (`board mirror is stale
   (observedSha 9f3c1a2 is not an ancestor of HEAD)`) doesn't include the link id that
   `mirrorStaleness` actually prefixes its reason with (`TASK-1: observedSha ... is not an
   ancestor of HEAD`); kept the link id in, since naming *which* link is stale is strictly
   more useful to the reader and the spec's own AC #5 wording ("naming the reason") is
   satisfied by either. Tests assert substrings, not the full literal spec example string, so
   this choice doesn't risk a false pass.
3. No new file for Phase 2 tests — reused Phase 1's `test/board-provider-seam.test.mjs`
   (the sibling file tasks.md/plan.md explicitly anticipate for board-mirror-adjacent
   coverage) rather than opening a second sibling.

**For Phase 3:** `planLinkedTask`/`planBridge` are completely untouched by Phase 2 — the
split into `planIntents`/`renderBacklog` (R5, AC #8) and the differential test (AC #3) are
both still fully open. `checkBridge`'s new R3/R4 block sits above the existing per-task loop
and reads `root` only (no `task` in scope yet at that point), so it should not interact with
anything Phase 3 touches inside `planLinkedTask`.
