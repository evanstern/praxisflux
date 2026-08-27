# 053 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Precondition:** spec 052 is merged. `lib/board-mirror.mjs` exists with `readMirror`,
`mirrorStaleness`, and `providers`.

## Phase 1 — The seam and root resolution (behavior must not change)

- [ ] Read `spec-bridge/gates/bridge.mjs`, `spec-bridge/gates/cli.mjs`,
      `lib/project-root.mjs`, and `lib/gate-runner.mjs`; record in Notes every root-resolution
      site and how the runner handles a gate function that throws
- [ ] Implement `boardLinks(root)` with R1's three-step order — **mirror first**, live
      Backlog projection second, `[]` third — and comment why mirror-first (otherwise an
      adopted mirror is never exercised and 052's drift check guards a file nothing reads)
- [ ] Replace the `findLinkedTasks` call in `checkBridge` with `boardLinks`; run `node --test`
- [ ] Replace it in `verifyBridge`; run `node --test`
- [ ] Replace it in `planBridge`; run `node --test`
- [ ] Add `hasAnyChild(...names)` to `lib/project-root.mjs` (one definition, composed from
      `hasChild`)
- [ ] Update `bridgeGate.resolveRoots` to `hasAnyChild(".board", "backlog")`
- [ ] Update `spec-bridge/gates/cli.mjs`'s `findRootUpwards` predicate in lockstep — the hook
      and the CLI must never disagree about what a project is
- [ ] Test AC #4: `.board`-only, `backlog`-only, and both-present roots resolve under **both**
      resolvers
- [ ] `node --test` green with `test/spec-bridge.test.mjs`, `test/project-gates.test.mjs`,
      `test/phase-status.test.mjs` **unedited**
- [ ] Commit

## Phase 2 — The fail-closed findings (new behavior, isolated)

- [ ] Implement R3: `checkBridge` runs `mirrorStaleness`; a stale `requiresSync: true` mirror
      emits exactly one blocking problem naming the reason **and** the remedy
      (`run the board:sync skill`)
- [ ] Implement R3's asymmetry: a stale `requiresSync: false` mirror emits **no** staleness
      problem, and carry the reason in a code comment — same word, different consequence,
      or a future reader "fixes" it
- [ ] Implement R4: a declared `requiresSync: true` provider with an absent
      `.board/links.json` emits the blocking "no board evidence" problem
- [ ] Read `.board.json` if present; treat its absence as `provider = "backlog"` so this
      spec lands and tests before 054 merges
- [ ] Tests for ACs 5, 6, 7 — assert on **message content**, not just problem count, so the
      fail-closed path can never be mistaken for an empty board
- [ ] Confirm a throwing `readMirror` surfaces through `lib/gate-runner.mjs` as a blocking
      problem rather than crashing the Stop hook; record how you verified it
- [ ] Commit

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

(Implementers append findings here — the phase-to-phase handoff artifact.)
