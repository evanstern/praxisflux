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

- [ ] T014 Env-gated capture, **off by default** — absent ⇒ byte-identical behavior, not one
      extra syscall.
- [ ] T015 Record per invocation: timestamp, the resolved **roots** (`resolveRoots`'s return
      — the point of R4, not just the exit code), and per gate command argv/cwd/status/signal
      plus **bounded** stdout/stderr (a 45s suite's output is large — cap it).
- [ ] T016 Write append-only JSONL **outside the tracked tree** (never inside the repo — a
      Stop hook that dirties the tree would poison the very check Phase 2 adds).
- [ ] T017 **Verdict-neutral:** instrumentation failure is swallowed and never turns a green
      gate red. Test that the default path writes nothing and the verdict is unchanged.
- [ ] T018 Bare `node --test` green. Commit; **push**.

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
