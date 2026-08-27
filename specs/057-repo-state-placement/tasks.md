# 057 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Dogfood note:** this branch is the first user of the rule it ships. It will stale wiki
notes mid-task and **must commit cleanly without `--no-verify`**. Any phase that reaches for
`--no-verify` has found a defect in this spec — record it, don't bypass it.

## Phase 1 — State the rule; compute the window

- [ ] Read `grounding-wiki/gates/freshness.mjs`, `docs/skill-patterns.md` §5,
      `docs/wiki/gates-convention.md`, and `.spec-bridge.json`'s `redByConstruction` block;
      record in Notes how spec 050 already frames red-by-construction
- [ ] Write the repo-state vs code-behavior rule into `docs/skill-patterns.md`, including the
      **mechanical** distinguishing question: *does this assertion's outcome depend on
      uncommitted or in-progress work elsewhere in the tree?*
- [ ] Reference the rule from `docs/wiki/gates-convention.md` — one canonical home, others
      point at it
- [ ] Implement the window computation in `grounding-wiki/gates/` (beside
      `validateFreshness`, **not** inside `stop-docs.mjs` — TASK-105 will want the same
      computation). Per stale note:
      `git log --oneline <pin>..HEAD --not origin/main -- <sources>`; non-empty ⇒ inside
- [ ] Confirm the rejected alternative is documented in the code comment: "branch has commits
      not on origin/main" FAILS because local `main` routinely sits ahead of origin under the
      two-track landing rule (verified: 2 commits ahead at authoring time)
- [ ] Degrade **closed**: no `origin/main` ref (fresh clone, detached CI, no remote) ⇒ treat
      as outside the window ⇒ block. Never open the window on missing information
- [ ] Tests: inside-window, outside-window, staleness explained by an already-merged commit,
      and the no-`origin/main` fallback
- [ ] Commit

## Phase 2 — Move the self-check; close the CI gap

- [ ] Read `docs/consuming-gates.md` before touching `run-gates.mjs` — its exit codes are a
      **versioned consumer contract** and must not shift
- [ ] Remove the repo-state assertion from `test/run-gates.test.mjs`; **retain every other
      test in the file** (usage errors, course-gate failure, crash-vs-usage exit codes, the
      GATES/action.yml drift check)
- [ ] Document the replacement one-liner:
      `node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness --path .`
- [ ] **Add a `spec-bridge` step to `.github/workflows/ci.yml`** — the enforcement the
      removed test was solely providing. CI has a `wiki-freshness` step but **no**
      spec-bridge step; removing the test without this silently drops board-honesty
      enforcement on this repo
- [ ] Add a test that reads the **real** `ci.yml` and asserts the spec-bridge step is
      present, so it cannot be dropped silently later. Model it on the existing
      GATES/`action.yml` drift check in the same file
- [ ] **AC #5 — prove it by execution, not argument:** on a scratch branch, deliberately
      stale a pinned note, run `node --test` (must be **green**), and commit with hooks
      enabled (must **succeed**). Record the transcript in Notes
- [ ] Commit

## Phase 3 — pre-push warns; stop-docs becomes window-aware

- [ ] Restructure `.githooks/pre-push` to run each check, capture output, print findings, and
      **exit 0**. `set -e` is currently on and aborts at the first nonzero — remove or scope
      it and capture exit codes explicitly
- [ ] **Preserve the fail-closed distinction:** a gate that produced parseable *findings*
      warns; a gate that **crashed, timed out, or could not run** still fails. Distinguish by
      whether findings were produced, not by exit code alone
- [ ] Warning text must state that mid-PR redness is expected before the re-pin/bump — a
      warning that reads like a failure trains the same bypass reflex it exists to remove
- [ ] Wire the Phase-1 window into `scripts/stop-docs.mjs`: inside ⇒ **notice** naming the
      owed re-pin, turn ends; outside (and on `main`) ⇒ **blocks**, as today
- [ ] The notice states the obligation as **owed, not discharged** — due before the PR
      (TASK-105's ordering ruling), not forgiven
- [ ] Confirm `checkDocs` (README/CLAUDE sync) is **unchanged and unconditionally blocking**:
      it compares tracked files to repo structure, so it is never red-by-construction
- [ ] Tests: both sides of the window for `stop-docs`; `pre-push` warns on findings and still
      fails on a missing/crashing gate script
- [ ] Commit

## Phase 4 — Retire the softening, re-ground, close

- [ ] Update `docs/design/gates-and-doctrine-sweep-runbook.md:30-32`: record amendment 1's
      `--no-verify` softening as **expired**, naming this spec
- [ ] State that the replacement is **this mechanism, not a new license** — sessions no longer
      need `--no-verify` because the hooks no longer forbid the legitimate mid-task state. An
      expiry that reads as "the bypass is gone, good luck" invites its reinvention
- [ ] Enumerate the before/after PR-blocking checks in the PR body (AC #10): local surfaces
      more permissive, authoritative surface strictly stronger (spec-bridge added)
- [ ] Check whether this PR touches released surface (`scripts/`) — if so, bump the
      marketplace version and run `node scripts/sync-version.mjs`
- [ ] Re-pin `docs/wiki/` notes whose `sources:` this touched — at minimum
      `gates-convention`, `test-suite`, `skill-patterns`, `build-and-release`; classify each
      **RE-PIN-ONLY** or **NEEDS-REVIEW** per the honest-re-pins rule
- [ ] Run `node scripts/check-docs.mjs`; update `README.md`/`CLAUDE.md` if what the repo
      enforces changed
- [ ] All gates green: `node --test`, `run-gates.mjs --gates spec-bridge,wiki-freshness`,
      `check-docs`, `sync-version --check`, `check-version-bump`
- [ ] **Confirm this PR was opened without a single `--no-verify`** — the practical proof the
      wedge is gone. If any was needed, that is a defect in this spec: record it
- [ ] Commit

## Notes

(Implementers append findings here — the phase-to-phase handoff artifact.)

**Pre-recorded finding (authoring session, 2026-08-27):** CI has **no** `spec-bridge` step.
`.github/workflows/ci.yml` runs tests, gen-marketplace, sync-version, build, check-docs,
freshness, version-bump. So `test/run-gates.test.mjs:20` is currently the **only**
spec-bridge enforcement praxisflux has on itself. This is why Phase 2 pairs the removal with
a CI addition — a removal alone would reintroduce, in this repo, the exact silent-no-op class
the board-provider seam epic (TASK-108) exists to close.
