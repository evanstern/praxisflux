# 057 — Repo-state self-checks gate the PR, not every intermediate action

Board task: **TASK-102** · retires: runbook amendment 1's `--no-verify` softening
(`docs/design/gates-and-doctrine-sweep-runbook.md:30-32` — "It expires when **TASK-102**
merges") · unblocks: **TASK-105**, **TASK-108/109** (the board-provider seam epic)

## Problem

Two of this repo's own rules are **mutually unsatisfiable** for any multi-commit task that
touches released surface.

**Rule 1 — doctrine sequences the re-pin last.** A wiki re-pin belongs *after* the commit
that touched the pinned sources (the sweep's "honest re-pins" rule: read the diff the pin
covers, then bump). The version bump belongs at merge-readiness.

**Rule 2 — `.githooks/pre-commit` runs the full `node --test`**, which includes
`test/run-gates.test.mjs:20`:

```js
test("run-gates: the praxisflux repo itself passes spec-bridge and wiki-freshness", () => {
  const results = runGates(["spec-bridge", "wiki-freshness"], opts(repo));
  for (const r of results) assert.deepEqual(r.problems, [], …);
```

So the first commit that touches a pinned source stales a note, reddens `node --test`, and
**blocks every subsequent commit on that branch** until the re-pin lands — which rule 1 says
must come last. `.githooks/pre-push` independently blocks on freshness *and*
`check-version-bump`, so intermediate **pushes** are blocked too.

The only ways through are `--no-verify`, re-pinning dishonestly mid-task, or abandoning
phase-scoped commits.

### The field case this produced

`specs/048`'s branch carries several source-touching commits before its re-pin commit
`67f1172`. TASK-100 records the outcome: **"254 pass, 0 fail" reported and a `tasks.md` box
ticked while four wiki notes were staled and the freshness gate was red.** The report was
true when run and false once committed.

That is the whole mechanism: **a hook that cannot be satisfied trains sessions to bypass it,
and a bypassed gate reports green while proving nothing.** Found in execution during the
gates+doctrine sweep (2026-08-02, TASK-100 Phase 1), reproduced independently by TASK-93
Phase 2.

### Reproduced during this card's own claim (2026-08-27) — and it is broader than described

Claiming TASK-102 by the book — status `In Progress`, spec dir authored on the task branch,
`Spec:` marker on the card — took `node --test` from **417 pass / 0 fail to 416 / 1**. The
chain was confirmed by flipping the status back (417/0) and forward again (416/1).

The failing assertion is the same `run-gates.test.mjs:20` self-check, but **the trigger is
not wiki staleness** — no note was stale yet. It is the *spec-bridge* half: the card says
`In Progress` while `specs/057` exists only on the branch, so the root-reading gate reports
`spec.md missing, plan.md missing, no tasks in tasks.md`.

Two consequences this spec must carry:

1. **The wedge fires at the claim, not at the first source-touching commit.** The card frames
   it as freshness-driven (re-pin sequenced last). Both gates in the self-check drive it, and
   the spec-bridge half fires **earlier** — at step 2 of the sweep loop, before a single
   source file is edited. So *every* sweep task hits this, not only those touching pinned
   sources. R2 already moves the whole self-check; the phasing simply needs to know the
   spec-bridge half is the common case.
2. **TASK-104 is entangled with this card.** TASK-104 (the gate is blind to branch-local spec
   dirs) is the direct cause of this instance. Both remain wanted, and they fix different
   halves: **this card stops the blocking; TASK-104 stops the wrong answer.** Neither
   subsumes the other, and this spec does not widen to include it.

A cascade worth naming so it is not misread as a separate defect: with the suite red,
specs/051's TASK-101 row reports "ticked box over a red required gate" (spec 050's
project-gate check). It clears when the suite is green.

### The amplification: one red gate, fifty blocked cards

Splitting the claim — card flipped at root, spec dir authored on the branch — put the root
into the mismatched state above. The Stop hook then reported **~50 findings**, one per
Done-eligible spec on the board:

> TASK-33 · specs/008-…: box "T007 board finalized…" is ticked, but the required gate
> "tests" is red (exited 1). A ticked tasks.md checkbox cannot outrun a red project gate.

Every one of those is a **cascade of the single red `tests` gate**, not an independent
defect. Spec 050's project-gate check runs `.spec-bridge.json`'s `required` gates at each
Done-eligible spec, so one red `node --test` re-reports itself once per finished spec. The
board looked catastrophically broken; nothing was wrong but one status flip.

Two things this adds to the requirements:

1. **The wedge is self-amplifying, and that is what trains the bypass.** A single
   red-by-construction gate does not present as one manageable finding — it presents as
   fifty, burying any real finding among them. R2's move is what stops the amplification at
   its source.
2. **The claim must be atomic.** The sweep's own doctrine already says so
   (`pdlc/skills/sweep/SKILL.md:167`): *"Make the claim the branch's FIRST commit — board
   card → In Progress, the spec number's directory … and the link."* Card and spec dir in
   **one commit on the branch**. Splitting them across root and branch manufactures exactly
   the mismatch the gate reports. This spec does not change that doctrine; it records that
   two-track landing's "board commits go direct to main" does **not** extend to the claim
   flip, which is deliverable state.

Recovery, for the record: cherry-pick the card change onto the branch, amend it into the
claim commit, reset the root. Root and branch then both read 417/0.

### The category error

`run-gates.test.mjs:20` is not a test. It asserts nothing about `runGates`' behavior — it
asserts a **property of this working tree right now**. Mid-PR redness there is **correct by
construction**, exactly as `.spec-bridge.json`'s `redByConstruction` bucket already declares
for the freshness gate (spec 050):

> declaring which host gates must be green before a linked spec may be Done-eligible
> (`required`) and which a mid-PR phase MAY leave red — the freshness gate between a source
> edit and its re-pin commit (`redByConstruction`)

The repo already holds the right concept in one place and contradicts it in another. This
spec makes the concept general.

### A must-fix found while orienting

**CI has no `spec-bridge` step.** `.github/workflows/ci.yml` runs: tests, gen-marketplace,
sync-version, build, check-docs, freshness, version-bump. Nothing runs `checkBridge` against
this repo.

So `run-gates.test.mjs:20` is currently the **only** spec-bridge enforcement praxisflux has
on itself. Deleting it without adding a CI step would silently drop board-honesty
enforcement — reintroducing, in this repo, the exact silent-no-op class the board-provider
seam epic exists to close. Any fix **must** move that assertion, never merely remove it.

## Requirements

### R1 — State the rule, once, where sessions read it

**A repo-STATE self-check — an assertion about *this checkout's* end state — never gates an
intermediate action. It gates the PR.** A code-behavior test — an assertion about what a
function does, given inputs it constructs — stays in `node --test` and gates every commit.

The distinguishing question is mechanical, not a judgment call: *does this assertion's
outcome depend on uncommitted or in-progress work elsewhere in the tree?* If yes, it is
repo-state.

Land the rule in `docs/skill-patterns.md` (§5 already governs `gates/` vs `scripts/`, so the
placement question has an established home) and reference it from `docs/wiki/`'s
`gates-convention` note. One canonical home; other surfaces point at it.

### R2 — Move the repo self-check out of the per-commit path

`test/run-gates.test.mjs:20` moves to a surface that runs at **PR time**, not per commit.
The test file keeps every genuine code-behavior test it has (usage errors, course-gate
failure, crash-vs-usage exit codes, the `GATES`/`action.yml` drift check) — those construct
their own fixtures and are unaffected by working-tree state.

The moved assertion must remain **executable and enforced**:

- a script a human and CI can both run, and
- **a CI step** — which, per the must-fix above, is a *new* step for spec-bridge, not just a
  relocation. `wiki-freshness` already has one (`ci.yml:31`); `spec-bridge` does not.

### R3 — `pre-push` warns; it does not block

**Operator ruling (2026-08-27).** `.githooks/pre-push` prints freshness and
`check-version-bump` findings and **exits 0**.

This is not a weakening — it is the repo's own stated posture, applied. `CLAUDE.md` says:

> the Stop hooks plugins ship are advisory/opt-in — local pressure while you work, never
> guaranteed present; CI … is the authoritative enforcement point

and `.githooks/pre-push` says of itself: *"Local mirror of the CI gate … CI stays
authoritative because core.hooksPath is per-clone."* A local mirror of an authoritative gate
should inform, not wedge. CI's enforcement is unchanged and remains the thing that blocks.

Requirements on the warning output: it must name **what** is red, and say plainly that
mid-PR redness is expected before the re-pin/bump — a warning that reads like a failure
trains the same bypass reflex.

### R4 — `stop-docs.mjs` stays blocking, but becomes window-aware

The Stop hook has the same wedge one level up: it refuses to end a turn while freshness is
red, which mid-task is red-by-construction.

**Operator ruling (2026-08-27): keep it blocking; make it window-aware.** Weakening it
outright would fight **TASK-105**, which exists precisely because re-grounding gets missed
and wants this mechanism *stronger*.

The window: between a commit touching a pinned source and that note's re-pin, staleness is
**expected**. Outside it, staleness is **neglect**. So:

- **Inside the window** — the branch carries commits touching pinned sources with no re-pin
  yet — Stop emits a **notice** naming the owed re-pin, and the turn ends.
- **Outside it** — including on `main`, and when nothing on the branch explains the
  staleness — Stop **blocks**, exactly as today.

The notice must state the obligation as *owed*, not discharged. A session that ends a turn
inside the window has not been forgiven the re-pin; it has been told when it is due (before
the PR — TASK-105's ordering ruling).

`checkDocs` (README/CLAUDE sync) is **not** window-aware and keeps blocking unconditionally:
it compares two tracked files to the repo's own structure, so it is never red-by-construction.

### R5 — Retire the `--no-verify` softening

`docs/design/gates-and-doctrine-sweep-runbook.md:30-32` records amendment 1's softening as
"**Still in force** … It expires when **TASK-102** merges." Update that runbook to record
the expiry, naming this spec.

The softening's replacement is **this spec's mechanism, not a new license**: sessions no
longer need `--no-verify` because the hooks no longer forbid the legitimate mid-task state.
Say that explicitly — an expiry that reads as "the bypass is gone, good luck" invites its
reinvention.

### R6 — Nothing this spec does may weaken CI

Every check that blocks a PR today still blocks it after this spec, and spec-bridge gains
one. Enumerate the before/after in the PR body so the trade is visible: **local surfaces get
more permissive; the authoritative surface gets strictly stronger.**

## Non-goals

- **Does not** change the freshness gate's arithmetic, the re-pin doctrine, or the honest
  re-pins rule. Those are correct; only their *placement* is at issue.
- **Does not** implement TASK-105's sign-off artifact. That card deps on this one for its
  placement ruling; this spec supplies the ruling, not the artifact.
- **Does not** touch `pre-commit`'s non-test checks (gen-marketplace, sync-version,
  check-docs). Each compares tracked files to repo structure and is satisfiable at every
  commit.
- **Does not** add a bypass flag. The fix is that the legitimate state stops being forbidden.

## Acceptance criteria

1. The repo-state vs code-behavior rule is stated in `docs/skill-patterns.md` with the
   mechanical distinguishing question, and referenced from `docs/wiki/gates-convention.md`.
2. `test/run-gates.test.mjs` no longer asserts this repo's own freshness/spec-bridge state;
   every other test in the file is retained and passing.
3. The moved assertion is executable by a human and by CI, and names its fix on failure.
4. **`ci.yml` gains a `spec-bridge` step** — the enforcement `run-gates.test.mjs:20` was
   solely providing. Asserted by a test reading the real `ci.yml`, so the step cannot be
   dropped silently.
5. On a branch whose HEAD stales a pinned note, `node --test` is **green** and a commit
   succeeds with hooks enabled — the exact scenario that is impossible today, proven end to
   end rather than argued.
6. `.githooks/pre-push` exits **0** with named warnings when freshness is red or a bump is
   owed; its output states that mid-PR redness is expected before the re-pin/bump.
7. `stop-docs.mjs` inside the window emits a notice naming the owed re-pin and lets the turn
   end; outside the window (and on `main`) it blocks as today. Both paths tested.
8. `checkDocs`'s blocking behavior is unchanged and unconditional.
9. The runbook records amendment 1's expiry, naming this spec and stating that the
   replacement is the mechanism, not a new license.
10. Every PR-blocking check that exists today still blocks, plus spec-bridge; the before/after
    is enumerated in the PR body. `docs/wiki/` re-pinned for every touched source — at minimum
    `gates-convention`, `test-suite`, `skill-patterns`, `build-and-release`.
