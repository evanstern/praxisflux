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

- [x] T027 Give `bridgeGate.check`/`.warn` an injection seam (or make the guard distinguish a
      test-owned invocation from a re-entrant spawn) so a `bridgeGate` test is honest under
      `SPEC_BRIDGE_GATE_ACTIVE=1`. **Non-negotiable: the guard must still stop real recursive
      spawning** — that is what defect 1 exists to prevent; do not simply delete the check.
      Done: `checkBridge` gained a third injectable-with-real-default param, `gateActive =
      process.env.SPEC_BRIDGE_GATE_ACTIVE === "1"` (same shape as `run`/`isDirty`), and
      `execGates` now reads `gateActive` instead of the env var directly. `bridgeGate.check`/
      `.warn` thread an optional second `opts` arg's `opts.gateActive` through to it — gate-
      runner's real `ctx` (`{ sessionId, input }`) never carries that key, so every production
      call keeps reading the real env exactly as before; only a test that explicitly passes
      `{ gateActive: false }` bypasses the flag.
- [x] T028 Prove it both ways: bare `node --test` green **AND**
      `SPEC_BRIDGE_GATE_ACTIVE=1 node --test` green, same counts. Report both.
      Done: bare `node --test` → 526/526 pass, 0 fail. `SPEC_BRIDGE_GATE_ACTIVE=1 node --test`
      → 526/526 pass, 0 fail. Same counts both ways (525 baseline + 1 new T029 test).
- [x] T029 Add a regression test pinning the invariant that the suite is green under the flag,
      so this cannot silently return — the defect's whole nature is that it is invisible to an
      unflagged run.
      Done: `test/project-gates.test.mjs` — "T027-T029 regression: bridgeGate.check stays
      honest under SPEC_BRIDGE_GATE_ACTIVE via the gateActive seam, and the reentrancy guard
      still holds without it" sets the flag directly and asserts both halves in one process
      (no nested `node --test` spawn): `gateActive:false` still runs the declared gate for
      real (catches the red result, proves the command actually spawned via a spy file), and
      the plain `bridgeGate.check(root)` call (no seam) still returns `[]` under the same set
      flag — the reentrancy guard remains fully armed.
- [x] T030 Commit; **push**.

## Phase 4 — Dogfood, catalog, bump, re-ground

- [x] T019 **Dogfood in situ:** with a deliberately red gate, this repo's own Stop-hook gate
      emits **one** finding rather than ~57. This is R1's acceptance evidence — the change is
      *about* this repo's own gate. Record the before/after count.
      Done: in-process `checkBridge(root)` against this repo's real board (58 Done-eligible
      linked specs), one gate ("tests") forced red — AFTER (collapsed): 1 finding, naming the
      gate + "58 linked specs affected". BEFORE (reconstructed via the pre-collapse per-spec
      loop over the same board): 58 findings. Caveat recorded on the board task: the installed
      plugin cache still runs pre-fix code, so a real Stop hook can't show this until merge.
- [x] T020 Catalog the test changes in `docs/wiki/test-suite-catalog-plugins-gates.md`
      (6,820/8,000 — real headroom; takes its per-file bullet normally).
      Done: bullet expanded to cover the fan-out collapse, dirty-tree label + controls,
      T018a's `{problems,warnings}` shape, the `bridgeGate` wiring test, the `gateActive` seam
      (T027-T029), and the R4 trace. Body 5,882 -> 7,232 chars, still under 8,000.
- [x] T021 Marketplace version bump + re-sync every `plugin.json`:
      `node scripts/sync-version.mjs <version>` (released surface — `spec-bridge/` is a plugin
      dir). Bump a skill's `version:` **only** if a file under `spec-bridge/skills/` changed;
      `gates/` is not a skill dir.
      Done: 0.60.0 -> 0.61.0 (minor: a behavior change to a shipped gate). No file under
      `spec-bridge/skills/` changed this task, so no skill version was owed.
- [x] T022 `docs/wiki/spec-bridge-plugin.md`: prose comes out **net-neutral-or-smaller** in
      body chars (already 8,446 and `size_budget_exempt`) — say the new thing by replacing the
      sentence it supersedes. Do **not** extend the exemption; do **not** attempt TASK-95's
      owed split.
      Done: the "Project gates" paragraph's stale sentences (one-evaluateProjectGates-call-
      per-spec, flat `verifyBridge` return) replaced with the collapse + dirty-tree-label +
      `{problems,warnings}` facts, trimmed elsewhere in the same paragraph to net out smaller:
      body 8,446 -> 8,444 chars. Exemption clause untouched, not extended.
- [x] T023 Honest re-pins: classify every staled note via
      `git diff <old-pin>..<new> -- <sources>` as RE-PIN-ONLY or NEEDS-REVIEW; amend prose
      before bumping. The version bump touches every `plugin.json` (~17 notes staleable).
      Done: 13 notes classified and re-pinned — 6 RE-PIN-ONLY (build-plugin,
      codebase-to-course-plugin, educate-plugin, gates-consumption-surface,
      grounding-wiki-plugin, research-plugin); 5 NEEDS-REVIEW verified as needing no prose
      change (build-and-release, pdlc-plugin, reorient-plugin, team-review-plugin,
      test-suite-catalog-plugins — every quoted version number is a skill version or a
      historical milestone, none the marketplace version that moved); spec-bridge-plugin.md
      and test-suite-catalog-plugins-gates.md already amended in the T020/T022 commit, just
      re-pinned here.
- [x] T024 **Re-run the freshness gate AFTER the re-pin commit** — cascade:
      `test-suite-catalog-plugins-gates.md` is a hub note pinning a test file this task edits.
      One pass is not enough.
      Done: took 3 freshness passes to converge — (1) post-bump: 13 notes NEEDS-REVIEW/
      RE-PIN-ONLY; (2) post-re-pin-commit: the re-pin itself re-staled
      `test-suite-catalog-plugins.md` (its hub source's pin line moved, +1/-1, no content
      change) — re-pinned again; (3) clean: 41/41 fresh, exit 0, `plan` prints nothing.
- [x] T025 All four green: bare `node --test`, `scripts/check-docs.mjs`,
      `scripts/sync-version.mjs --check`, freshness gate. Verify committed content with
      `git show HEAD:<file>` (F6), not by reading disk.
      Done: `node --test` 526/526 (both unflagged and `SPEC_BRIDGE_GATE_ACTIVE=1`);
      `check-docs.mjs` exit 0; `sync-version.mjs --check` exit 0 (0.61.0); freshness exit 0.
      Verified via `git show HEAD:docs/wiki/{spec-bridge-plugin,test-suite-catalog-plugins-gates}.md`.
- [x] T026 Merge `origin/main` **in** (pin-carrying branch — never rebase/squash/force-push);
      re-run gates **and** the freshness probe unconditionally after the merge. Commit; push;
      open the PR (lands as a **merge commit**).
      `origin/main` is 0 commits ahead of this branch's base (re-verified before and after
      Phase 4's commits) — no merge-in was needed. Committed and **pushed**
      (`task-119-bridge-gate-fanout`, pre-push version-bump and freshness hooks both `ok`).
      Opening the PR is the orchestrator's step, per dispatch scope — left undone here.
