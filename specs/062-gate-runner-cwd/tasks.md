# 062 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases. Push after every
phase's commit (runbook F4). Run the suite as bare `node --test` — never with a path
argument.

**Precondition:** none. TASK-0122's root cause is already found and recorded on the card and
in `spec.md` — do not re-derive it.

## Phase 1 — The decoy regression test, captured RED first

- [x] Add a decoy test to `test/board-provider-seam.test.mjs`: set `CLAUDE_PROJECT_DIR` to a
      decoy directory, pass an explicit `{ cwd }` pointing at a real fixture, and assert the
      gate resolved against the fixture rather than the decoy
- [x] **Run it against UNMODIFIED `lib/` and capture the failure output in the commit
      message.** A regression test that never failed is not evidence — this RED is the
      artifact proving the defect
- [x] Guard the new test's own state: restore `CLAUDE_PROJECT_DIR` in a `finally` so it
      cannot leak into sibling tests
- [x] Commit (test only, still red) and push

## Phase 2 — The precedence change

- [x] Change `lib/gate-runner.mjs`'s resolution so an explicitly-passed `{ cwd }` wins, then
      `CLAUDE_PROJECT_DIR`, then `input.cwd`, then `process.cwd()`
- [x] Make "no cwd passed" distinguishable from a passed value: default the option to
      `undefined` and fall back inside the expression, NOT in the destructuring default
      (today's `{ cwd = process.cwd() }` erases the distinction — the mechanical reason this
      bug was possible)
- [x] State the four-step ordering AND its rationale in the contract comment at the top of
      `lib/gate-runner.mjs` (why explicit beats ambient; why the env var still beats
      `input.cwd`)
- [x] Confirm the real Stop-hook path is untouched: `runStopHook` (line ~77) passes no cwd,
      so nothing-passed behaviour must be byte-identical to before
- [x] Phase 1's decoy test now PASSES; full suite green **both** with `CLAUDE_PROJECT_DIR`
      set and unset
- [x] Commit and push

## Phase 3 — Audit the eight hand-rolled guards

- [x] For each of `install-path`, `spec-bridge`, `root-guard-hook`, `phase-status`, `pdlc`,
      `team-review`, `reorient`, `board-provider-seam`: read what its guard protects and
      classify it — REMOVE (redundant after the fix) or KEEP (with a one-line comment
      stating why)
- [x] Expect KEEPs: a test that spawns a **subprocess** still needs the env var managed,
      because the precedence change governs in-process resolution only and a child inherits
      the ambient environment regardless. Classify per file — a blanket removal
      reintroduces failures in exactly the subprocess-shaped tests
- [x] Every guard that stays carries its stated reason; a guard kept without one is a guard
      nobody can retire later
- [x] Full suite green both ways after the audit
- [x] Commit and push

## Phase 4 — Release obligations and re-ground

- [ ] `node scripts/sync-shared.mjs`, then verify all NINE vendored `lib/gate-runner.mjs`
      copies match the source (build, codebase-to-course, educate, grounding-wiki, pdlc,
      reorient, research, spec-bridge, team-review)
- [ ] Marketplace version bump per `docs/releasing.md`; `node scripts/sync-version.mjs
      --check` exits 0
- [ ] **Verify the bump landed in the COMMIT via `git show HEAD:<file>`, never by reading the
      working tree** (runbook F6: a `--check` against a dirty tree proves nothing)
- [ ] Re-ground via the classifier `node grounding-wiki/gates/cli.mjs plan . docs/wiki`;
      classify every stale pin RE-PIN-ONLY vs NEEDS-REVIEW by reading the diff over its
      sources, and amend prose BEFORE bumping any pin
- [ ] Treat `docs/wiki/gate-runner.md`, `chassis.md`, and `gates-convention.md` as
      NEEDS-REVIEW candidates — they describe the resolution contract this spec changes — and
      update `gate-runner.md`'s resolution-order prose
- [ ] **Re-run the freshness gate AFTER committing the re-pins** and expect a possible second
      cascading pass (runbook: a note in another note's `sources:` propagates staleness);
      check whether `CAPSULES.md` needs a line
- [ ] All three required project gates exit 0 (suite, `check-docs`, `sync-version --check`)
      plus freshness; commit, push, open ONE PR, merge as a merge commit
