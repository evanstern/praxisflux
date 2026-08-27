# 057 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases.

**Dogfood note:** this branch is the first user of the rule it ships. It will stale wiki
notes mid-task and **must commit cleanly without `--no-verify`**. Any phase that reaches for
`--no-verify` has found a defect in this spec — record it, don't bypass it.

## Phase 1 — State the rule; compute the window

- [x] Read `grounding-wiki/gates/freshness.mjs`, `docs/skill-patterns.md` §5,
      `docs/wiki/gates-convention.md`, and `.spec-bridge.json`'s `redByConstruction` block;
      record in Notes how spec 050 already frames red-by-construction
- [x] Write the repo-state vs code-behavior rule into `docs/skill-patterns.md`, including the
      **mechanical** distinguishing question: *does this assertion's outcome depend on
      uncommitted or in-progress work elsewhere in the tree?*
- [x] Reference the rule from `docs/wiki/gates-convention.md` — one canonical home, others
      point at it
- [x] Implement the window computation in `grounding-wiki/gates/` (beside
      `validateFreshness`, **not** inside `stop-docs.mjs` — TASK-105 will want the same
      computation). Per stale note:
      `git log --oneline <pin>..HEAD --not origin/main -- <sources>`; non-empty ⇒ inside
- [x] Confirm the rejected alternative is documented in the code comment: "branch has commits
      not on origin/main" FAILS because local `main` routinely sits ahead of origin under the
      two-track landing rule (verified: 2 commits ahead at authoring time)
- [x] Degrade **closed**: no `origin/main` ref (fresh clone, detached CI, no remote) ⇒ treat
      as outside the window ⇒ block. Never open the window on missing information
- [x] Tests: inside-window, outside-window, staleness explained by an already-merged commit,
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

- [ ] **R5b — state the claim/board-commit boundary** in `pdlc/skills/sweep/SKILL.md`'s claim
      step AND the two-track bullet of `pdlc/templates/CLAUDE.md`'s `pdlc:peer:backlog` block:
      the claim flip is **deliverable state, not bookkeeping** — two-track's "direct to main"
      covers notes, AC ticks, labels, and new cards, never the status flip that claims a task
- [ ] Bump `pdlc/skills/sweep/SKILL.md`'s own `version:`; re-plant the root `CLAUDE.md`
      (or diff + consent its drift) so the planted block and the template agree
- [ ] Re-pin the four notes sourcing the sweep skill (`pdlc-sweep`, `pdlc-sweep-history`,
      `pdlc-sweep-history-early`, `pdlc-sweep-history-recent`) plus `pdlc-grounding-block`
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

### Phase 1 findings (2026-08-27)

**The rule's home.** `docs/skill-patterns.md` §4 already frames red-by-construction (spec
050's `redByConstruction` bucket) and already carries an "advisory vs. blocking, reconciled"
note. The placement rule went in as a sibling paragraph there rather than a new section — same
subject, one canonical home. `docs/wiki/gates-convention.md` got a compact pointer (note body
6279 → 7158 chars, budget 8000).

**The window, verified on live data — not just fixtures.** Committing Phase 1 staled exactly
two notes (`gates-convention`, `skill-patterns`, both sourcing `docs/skill-patterns.md`). The
window read **INSIDE** for both, naming the responsible commit `a0b005a`. That is the
end-to-end proof the fixtures can't give: real pins, real sources, real branch.

**Suite state at Phase 1 close: 425 pass / 1 fail — and the 1 IS the specimen.**
`run-gates.test.mjs:20`, red because those two notes are stale. Note what the failure message
now says: *"but the **red-by-construction** gate wiki-freshness is red"*. The repo's own
tooling names it red-by-construction **while blocking on it** — spec 050 classified the gate
correctly, and this test is the surface that ignores the classification. Phase 2 removes that
contradiction.

The amplification reproduced too: **~50 findings from those two stale notes**, one per
Done-eligible spec. This is the second independent reproduction (the first was the claim
mismatch), from a different root cause — confirming the amplification is a property of the
placement, not of any one trigger.

**Not yet done in Phase 1:** the two staled notes are deliberately left stale. Re-pinning them
now would be a dishonest re-pin (the honest-re-pins rule: read the diff the pin covers, then
bump) and would also destroy the live specimen Phase 2 needs for AC #5. They are re-pinned in
Phase 4, classified per the rule.
