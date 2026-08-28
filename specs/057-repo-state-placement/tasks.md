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

- [x] Read `docs/consuming-gates.md` before touching `run-gates.mjs` — its exit codes are a
      **versioned consumer contract** and must not shift
- [x] Remove the repo-state assertion from `test/run-gates.test.mjs`; **retain every other
      test in the file** (usage errors, course-gate failure, crash-vs-usage exit codes, the
      GATES/action.yml drift check)
- [x] Document the replacement one-liner:
      `node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness --path .`
- [x] **Add a `spec-bridge` step to `.github/workflows/ci.yml`** — the enforcement the
      removed test was solely providing. CI has a `wiki-freshness` step but **no**
      spec-bridge step; removing the test without this silently drops board-honesty
      enforcement on this repo
- [x] Add a test that reads the **real** `ci.yml` and asserts the spec-bridge step is
      present, so it cannot be dropped silently later. Model it on the existing
      GATES/`action.yml` drift check in the same file
- [x] **AC #5 — prove it by execution, not argument:** on a scratch branch, deliberately
      stale a pinned note, run `node --test` (must be **green**), and commit with hooks
      enabled (must **succeed**). Record the transcript in Notes
- [ ] Commit

## Phase 3 — pre-push warns; stop-docs becomes window-aware

- [x] Restructure `.githooks/pre-push` to run each check, capture output, print findings, and
      **exit 0**. `set -e` is currently on and aborts at the first nonzero — remove or scope
      it and capture exit codes explicitly
- [x] **Preserve the fail-closed distinction:** a gate that produced parseable *findings*
      warns; a gate that **crashed, timed out, or could not run** still fails. Distinguish by
      whether findings were produced, not by exit code alone
- [x] Warning text must state that mid-PR redness is expected before the re-pin/bump — a
      warning that reads like a failure trains the same bypass reflex it exists to remove
- [x] Wire the Phase-1 window into `scripts/stop-docs.mjs`: inside ⇒ **notice** naming the
      owed re-pin, turn ends; outside (and on `main`) ⇒ **blocks**, as today
- [x] The notice states the obligation as **owed, not discharged** — due before the PR
      (TASK-105's ordering ruling), not forgiven
- [x] Confirm `checkDocs` (README/CLAUDE sync) is **unchanged and unconditionally blocking**:
      it compares tracked files to repo structure, so it is never red-by-construction
- [x] Tests: both sides of the window for `stop-docs`; `pre-push` warns on findings and still
      fails on a missing/crashing gate script
- [ ] Commit

## Phase 4 — Retire the softening, re-ground, close

- [x] **R5b — state the claim/board-commit boundary** in `pdlc/skills/sweep/SKILL.md`'s claim
      step AND the two-track bullet of `pdlc/templates/CLAUDE.md`'s `pdlc:peer:backlog` block:
      the claim flip is **deliverable state, not bookkeeping** — two-track's "direct to main"
      covers notes, AC ticks, labels, and new cards, never the status flip that claims a task
- [x] Bump `pdlc/skills/sweep/SKILL.md`'s own `version:`; re-plant the root `CLAUDE.md`
      (or diff + consent its drift) so the planted block and the template agree
- [x] Re-pin the four notes sourcing the sweep skill (`pdlc-sweep`, `pdlc-sweep-history`,
      `pdlc-sweep-history-early`, `pdlc-sweep-history-recent`) plus `pdlc-grounding-block`
- [x] Update `docs/design/gates-and-doctrine-sweep-runbook.md:30-32`: record amendment 1's
      `--no-verify` softening as **expired**, naming this spec
- [x] State that the replacement is **this mechanism, not a new license** — sessions no longer
      need `--no-verify` because the hooks no longer forbid the legitimate mid-task state. An
      expiry that reads as "the bypass is gone, good luck" invites its reinvention
- [ ] Enumerate the before/after PR-blocking checks in the PR body (AC #10): local surfaces
      more permissive, authoritative surface strictly stronger (spec-bridge added)
- [x] Check whether this PR touches released surface (`scripts/`) — if so, bump the
      marketplace version and run `node scripts/sync-version.mjs`
- [x] Re-pin `docs/wiki/` notes whose `sources:` this touched — at minimum
      `gates-convention`, `test-suite`, `skill-patterns`, `build-and-release`; classify each
      **RE-PIN-ONLY** or **NEEDS-REVIEW** per the honest-re-pins rule
- [x] Run `node scripts/check-docs.mjs`; update `README.md`/`CLAUDE.md` if what the repo
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

### Phase 1 finding — the hooks were never running (2026-08-27)

**Correction to an earlier claim in this task's notes and commits.** I reported commits
passing "with hooks enabled and no `--no-verify`". That was wrong, and the error was mine:
I inferred hook execution from a clean commit instead of verifying it.

`git config core.hooksPath` on this clone resolves to
`/Users/evanstern/neumo/projects/praxis/.githooks` — **a path that does not exist** (the
checkout lives at `/Users/evanstern/projects/praxis`; the stale value survives from an earlier
location, and the same stale path appears in the pre-existing prunable worktree entry). Git
silently runs no hook when `core.hooksPath` is a dead directory. So `pre-commit` has not
executed for any commit in this session.

Running it by hand against this tree: **exit 1**. Every Phase 1 commit *would* have been
blocked, for exactly the red-by-construction reason spec 057 exists to fix.

Three consequences:

1. **The wedge is worse than measured, not better.** Nothing here disproves it; the local
   surface was simply disabled. On any clone with a correct `core.hooksPath` — which is what
   CI-adjacent contributors and a fresh `git config core.hooksPath .githooks` produce — Phase 1
   is unlandable without `--no-verify`.
2. **`core.hooksPath` is per-clone and silently fails open.** This is the same property
   `.githooks/pre-push` cites for why "CI stays authoritative", and it is stronger evidence for
   R3/R6 than the spec currently carries: a local surface that can vanish without a sound must
   not be the thing that guarantees anything, and CI must hold every check that matters.
   Worth a line in `docs/skill-patterns.md` where the rule now lives.
3. **AC #5 must be run with hooks provably active** — set `core.hooksPath` correctly first and
   assert the hook actually executes (a stub that touches a file, or a deliberate failure) —
   or it proves nothing. Phase 2 owns this.

Do **not** "fix" the operator's git config as part of this task: it is their environment, not
this repo's tracked state. Surface it, and let them decide.

### Phase 2 findings (2026-08-28) — AC #5 proven by execution

**Hook liveness established first.** The operator fixed `core.hooksPath` (now `.githooks`,
resolving). Before changing anything, I probed it with a throwaway commit against the still-stale
tree: **the hook fired and blocked it** — `git log` stayed at `5245c94`, nothing landed. So the
Phase 2 result below is measured against a hook that provably runs, which the Phase 1 note said
was mandatory or the proof is worthless.

**AC #5, the exact scenario that was impossible before:**

```
node grounding-wiki/gates/cli.mjs freshness . docs/wiki   → exit 1   (RED — 2 notes stale)
node --test                                                → 426 pass / 0 fail
git commit                                                 → SUCCEEDS, hooks live, no --no-verify
```

Same tree, same stale notes, same hook. Before Phase 2: 425/1 and every commit blocked. The
suite now tests code; the repo's own state is asserted where end-state invariants belong.

**The must-fix landed.** `ci.yml` gained a **spec-bridge** step (it had none — the removed test
was this repo's only spec-bridge enforcement) and its freshness step now routes through
`run-gates.mjs`, so both self-checks share one runner and one exit-code contract. The new drift
test reads the **real** `ci.yml` and fails if either step disappears, with a message naming the
consequence.

**Contract untouched.** `docs/consuming-gates.md` versions `run-gates.mjs`'s names/flags/exit
codes (0 pass · 1 any gate failed, crash counts as failed · 2 usage). This phase adds *callers*,
not a code change — `run-gates.mjs` itself is unmodified.

**Test count moved 426 → 426:** one repo-state assertion removed, one ci.yml drift check added.
Every genuine code-behavior test in the file is retained.

### Phase 3 findings (2026-08-28)

**Both surfaces changed, both verified live on this branch's real state.**

`pre-push` — findings warn (exit 0), unrunnable blocks (exit 1). Verified by running it against
this very tree: it reported the version bump owed and four stale notes, and **exited 0**. Then,
with `grounding-wiki/gates/cli.mjs` temporarily moved aside, it exited **1** with `COULD NOT RUN`.
That is the fail-closed distinction working, not argued.

**The classification cannot key on exit code alone** — this was the one real design problem in
the phase. Node exits `1` both for a gate's findings and for an uncaught exception, so a naive
"exit 1 ⇒ warn" would silently forgive a crashing gate, inverting the fail-closed doctrine. Each
check therefore declares a **marker regex** its genuine output contains; exit 1 *plus* a marker
is findings, anything else is a failure to run.

`stop-docs` — window-aware via the Phase-1 module, using `lib/gate-runner.mjs`'s existing `warn`
channel (non-blocking, surfaced on stderr). No new plumbing: inside the window routes to `warn`,
outside stays in `check`. Verified live — with four notes stale from this branch's unmerged
commits, the hook printed the owed re-pins and **exited 0**.

**Two deliberate non-generalizations**, both tested:
- A gate failure with **no** STALE line (malformed note, missing source, budget breach) never
  consults the window and always blocks. The window's excuse is only ever about staleness.
- `checkDocs` is untouched and unconditionally blocking — it compares tracked files to repo
  structure and is never red by construction.

**Phase 2 staled two more notes than tracked.** `pre-push`'s live run surfaced
`release-pipeline.md` and `test-suite-catalog.md` (from the `ci.yml` and test-file edits) on top
of Phase 1's two. Four notes now owe re-pins in Phase 4 — and the tool found them, which is the
point.

**A test bug of mine, worth recording.** My first "clean tree" assertion checked that the word
*findings* never appeared, but the hook's closing footer contained it unconditionally. The test
was right that something was off: a clean tree should not print an explanation of mid-PR redness
at all. Fixed on **both** sides — the footer is now gated on whether anything was reported, and
the assertion checks for the finding label rather than a bare word.

**Suite: 437 pass / 0 fail** (426 → 437: +6 stop-docs window, +5 pre-push).
