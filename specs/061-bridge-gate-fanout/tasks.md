# spec 061 — tasks

Phases are dispatched **one fresh implementer per phase** (sweep doctrine: cost is
structural — a long-lived implementer's context is mostly its own transcript). The handoff
between phases is the artifact set only: this file's tick state, the spec dir, and the
branch's commits. Nothing rides chat context.

**Every commit must leave the bare `node --test` suite green** — `.githooks/pre-commit` runs
it on every commit, so a red phase blocks its own commit.

## Phase 1 — Collapse the fan-out (R1, R3.1)

- [x] T001 Write the fan-out regression FIRST, in `test/project-gates.test.mjs`: a red gate +
      **N ≥ 2** Done-eligible linked specs. Assert exactly **one** finding, and that it names
      the gate. Include the **negative control** — assert the count is 1 where the pre-fix
      behavior yields N, so the test distinguishes fixed from broken (TASK-118's convention).
- [x] T002 Run it against current behavior and **record the observed N** in the commit
      message. A test that does not fail here is not testing the defect.
- [x] T003 Move gate evaluation out of `checkBridge`'s per-task loop: collect qualifying
      specs in the existing pass, then evaluate each distinct gate **once** and emit one
      finding per non-green gate naming gate + bucket + `gateReason` + **affected count**.
- [x] T004 Same collapse for `verifyBridge`, preserving its bucket asymmetry: track counts
      **per bucket** so a `redByConstruction` gate counts only the Done-eligible specs it
      applies to. Which gates run for which specs MUST NOT change — only the reporting.
- [x] T005 Keep `evaluateProjectGates` exported (imported by the test suite and documented as
      the pure evaluator). If its shape changes, update its doc comment and every call site
      in the same commit.
- [x] T006 Confirm no collateral change: green gates still yield nothing; `exceeds`/`lags`
      and mirror findings untouched; the `SPEC_BRIDGE_GATE_ACTIVE` guard **and** its
      injected-`run` bypass (spec 050 defect 1) still hold — without the bypass this repo's
      own dogfood reddens its `tests` gate.
- [x] T007 Bare `node --test` green. Commit; **push**.

## Phase 2 — Label the dirty-tree sample (R2, R3.2)

- [x] T008 Add `isTreeDirty(root)`: `spawnSync("git", ["status", "--porcelain"], { cwd: root })`,
      argv only, `shell:false`. Non-empty stdout = dirty. **Fail closed** — non-zero exit,
      spawn error, or git absent ⇒ `false` (treated clean, keeps blocking).
- [x] T009 Compute dirtiness **once per invocation**, not per gate or per spec.
- [x] T010 Route a dirty-tree gate verdict into `warnings` instead of `problems`, labeled:
      the sample was taken against a dirty tree and proves nothing about the commit.
- [x] T011 **Do not flip `runGates: true` in `bridgeGate.warn`** — that doubles every gate
      subprocess and re-opens the cost regression spec 050 fixed. Have the gate-running pass
      surface its dirty-tree warnings instead. **State in the commit message which mechanism
      was used, and confirm the subprocess count did not increase.**
- [x] T012 Tests: dirty + red ⇒ labeled non-blocking; **clean + red ⇒ still blocks** (the
      control); undeterminable ⇒ blocks (fail-closed). Non-gate findings unaffected.
- [x] T013 Bare `node --test` green. Commit; **push**.

## Phase 3 — Instrumentation for the unreproduced firings (R4)

- [x] T014 Env-gated capture, **off by default** — absent ⇒ byte-identical behavior, not one
      extra syscall.
- [x] T015 Record per invocation: timestamp, the resolved **roots** (`resolveRoots`'s return
      — the point of R4, not just the exit code), and per gate command argv/cwd/status/signal
      plus **bounded** stdout/stderr (a 45s suite's output is large — cap it).
- [x] T016 Write append-only JSONL **outside the tracked tree** (never inside the repo — a
      Stop hook that dirties the tree would poison the very check Phase 2 adds).
- [x] T017 **Verdict-neutral:** instrumentation failure is swallowed and never turns a green
      gate red. Test that the default path writes nothing and the verdict is unchanged.
- [x] T018 Bare `node --test` green. Commit; **push**.
- [x] T018a **Close the `verify` dirty-tree gap** (orchestrator ruling, 2026-09-08 — see
      R2's last bullet). Phase 2 scoped the dirty-tree label to `checkBridge`; `verifyBridge`
      still hard-blocks on a sample taken against a dirty tree, which reproduces P2 in the
      **mid-PR window where trees are dirtiest** and breaks the "agree by construction"
      property. `verifyBridge` MUST NOT block on a dirty-tree gate verdict and MUST keep the
      label **visible** — dropping it silently is not an acceptable resolution. Mechanism is
      yours: a `{problems, warnings}` return with `cli.mjs verify` printing warnings and
      exiting 0, or an equivalent. Update `cli.mjs`'s `verify` branch and the `verifyBridge`
      doc comment together, plus a test for dirty ⇒ non-blocking-and-labeled with the
      **clean ⇒ still blocks** control.

## Phase 3b — Fix the dogfood red this task's own tests introduced (BLOCKING for merge)

Found in orchestrator verification (2026-09-08) by exercising the new R4 trace, not by a
test — which is itself R4's argument. **Spec 050 defect 1, recurring through a path with no
injection seam.**

The trace from a real `bridgeGate.check` reported `node --test -> status 1` while a direct
bare `node --test` was green 525/525. The suite exits **1** under
`SPEC_BRIDGE_GATE_ACTIVE=1` — exactly the env the gate sets on every child it spawns. Five
tests added by Phases 2–3 fail there, all of which call `bridgeGate.check`/`.warn`
**directly**: the `bridgeGate` subprocess-count test and the four R4 trace tests.

Mechanism: `checkBridge`'s `execGates` is
`runGates && gatesProfile && (injected || SPEC_BRIDGE_GATE_ACTIVE !== "1")`. An **injected**
`run` bypasses the guard (defect 1's fix), but `bridgeGate.check` has no injection seam — it
hardcodes `checkBridge(root, { runGates: true })`. Under the flag those tests get
`execGates: false`, see zero gate findings, and their assertions fail.

Confirmed **new**, not pre-existing: `git show 0956e9b:test/project-gates.test.mjs` and
`git show origin/main:test/project-gates.test.mjs` both contain **zero** occurrences of
`bridgeGate`. The pre-sweep suite never exercised it directly, so it never tripped this.

Why it is merge-blocking: this repo's own `tests` gate **is** bare `node --test`, and the
gate runs it with the flag set. So the repo's dogfood reddens its own `tests` gate whenever a
`bridgeGate`-touching test exists — a self-inflicted red that would outlive this PR.

- [ ] T027 Give `bridgeGate.check`/`.warn` an injection seam (or make the guard distinguish a
      test-owned invocation from a re-entrant spawn) so a `bridgeGate` test is honest under
      `SPEC_BRIDGE_GATE_ACTIVE=1`. **Non-negotiable: the guard must still stop real recursive
      spawning** — that is what defect 1 exists to prevent; do not simply delete the check.
- [ ] T028 Prove it both ways: bare `node --test` green **AND**
      `SPEC_BRIDGE_GATE_ACTIVE=1 node --test` green, same counts. Report both.
- [ ] T029 Add a regression test pinning the invariant that the suite is green under the flag,
      so this cannot silently return — the defect's whole nature is that it is invisible to an
      unflagged run.
- [ ] T030 Commit; **push**.

## Phase 4 — Dogfood, catalog, bump, re-ground

- [ ] T019 **Dogfood in situ:** with a deliberately red gate, this repo's own Stop-hook gate
      emits **one** finding rather than ~57. This is R1's acceptance evidence — the change is
      *about* this repo's own gate. Record the before/after count.
- [ ] T020 Catalog the test changes in `docs/wiki/test-suite-catalog-plugins-gates.md`
      (6,820/8,000 — real headroom; takes its per-file bullet normally).
- [ ] T021 Marketplace version bump + re-sync every `plugin.json`:
      `node scripts/sync-version.mjs <version>` (released surface — `spec-bridge/` is a plugin
      dir). Bump a skill's `version:` **only** if a file under `spec-bridge/skills/` changed;
      `gates/` is not a skill dir.
- [ ] T022 `docs/wiki/spec-bridge-plugin.md`: prose comes out **net-neutral-or-smaller** in
      body chars (already 8,446 and `size_budget_exempt`) — say the new thing by replacing the
      sentence it supersedes. Do **not** extend the exemption; do **not** attempt TASK-95's
      owed split.
- [ ] T023 Honest re-pins: classify every staled note via
      `git diff <old-pin>..<new> -- <sources>` as RE-PIN-ONLY or NEEDS-REVIEW; amend prose
      before bumping. The version bump touches every `plugin.json` (~17 notes staleable).
- [ ] T024 **Re-run the freshness gate AFTER the re-pin commit** — cascade:
      `test-suite-catalog-plugins-gates.md` is a hub note pinning a test file this task edits.
      One pass is not enough.
- [ ] T025 All four green: bare `node --test`, `scripts/check-docs.mjs`,
      `scripts/sync-version.mjs --check`, freshness gate. Verify committed content with
      `git show HEAD:<file>` (F6), not by reading disk.
- [ ] T026 Merge `origin/main` **in** (pin-carrying branch — never rebase/squash/force-push);
      re-run gates **and** the freshness probe unconditionally after the merge. Commit; push;
      open the PR (lands as a **merge commit**).
