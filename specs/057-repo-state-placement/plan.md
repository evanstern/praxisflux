# 057 — implementation plan

## Constitution check

**This project has no ratified constitution.** `.specify/` is absent; artifacts are
hand-authored under the sweep runbook's operator-signed escape line. Checked against:

| Grounding doc | What it binds here |
|---|---|
| `CLAUDE.md` — "Enforcement is split by design" | the sentence R3 *applies* rather than changes: advisory local, authoritative CI |
| `docs/wiki/gates-convention.md` | fail-closed: a crashing check is blocking. R3/R4 must not turn a **crash** into a warning — only a red-by-construction *finding* |
| `docs/skill-patterns.md` §5 | `gates/` vs `scripts/`; R1's rule lands here |
| `docs/principles.md` P1 | the window must be computed from artifacts (git), never from a session's claim about its own intent |
| `.spec-bridge.json` `redByConstruction` | the concept already exists in this repo; generalize it, don't invent a second |
| `docs/releasing.md` | `scripts/` and `.githooks/` — check whether this PR touches released surface and bump if so |

**Tension, named and resolved.** R3 and R4 both make a local surface more permissive, and
the repo's fail-closed doctrine says a check that cannot run is blocking. These do not
conflict, but the distinction is easy to lose in implementation and **must** be preserved:

- a gate that **reports a red finding** may be advisory locally (that finding is
  reproduced authoritatively in CI);
- a gate that **crashes, times out, or cannot run** is still a blocking problem everywhere.

Concretely: in `pre-push`, a nonzero exit from the freshness gate that produced *findings*
warns; a nonzero exit because node blew up, the script is missing, or git is unavailable must
still fail. Distinguish them by whether the gate produced parseable findings on stdout, not
by exit code alone.

## Approach

### R4's window: the one real design decision

"Mid-task" must be computed from artifacts, never asserted by the session (P1). I tested the
candidate definitions in the worktree before writing this.

**Rejected — "the branch has commits not on `origin/main`."** I verified this fails on this
very repo: local `main` currently sits **2 commits ahead of `origin/main`** (unpushed
board-track commits, which the two-track landing rule makes routine). Under that test, `main`
itself would count as "mid-task" and the Stop hook would go quiet exactly where R4 says it
must block.

**Adopted — "the commits that stale this note are themselves unmerged."** Per stale note:

```sh
git log --oneline <pin>..HEAD --not origin/main -- <sources>
```

Non-empty ⇒ **inside the window**: unmerged work on this branch stales the note, and the
re-pin is legitimately owed later. Empty ⇒ **outside**: the staleness is explained by
something already on `origin/main` (or by nothing at all), so it is neglect and blocks.

Verified working in the worktree (`--not origin/main` filters correctly against a real pin
and real sources). Two properties that make it the right test:

- It is **per note**, so a branch that stales note A while note B is stale for an unrelated
  reason still blocks on B — a coarser branch-level flag would forgive both.
- It **degrades closed**: no `origin/main` ref (fresh clone, detached CI, no remote) ⇒ treat
  as outside the window ⇒ block. Never open the window on missing information.

Implement it in `grounding-wiki/gates/` beside `validateFreshness`, not inside
`stop-docs.mjs`. It is corpus-freshness knowledge, and TASK-105 will want the same
computation for its sign-off gate.

### R2: where the moved assertion goes

`node --test` should test code. The self-check moves to **`scripts/run-gates.mjs` invoked
against `.`** — the surface that already exists for exactly this, is already the CI
consumption contract, and already prints per-failure fixes:

```sh
node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness --path .
```

No new script needed; the assertion becomes a CI step plus a documented one-liner. Read
`docs/consuming-gates.md` before touching `run-gates.mjs` — its exit codes are a **versioned
consumer contract** and must not shift.

### R2/AC#4: the CI gap is the load-bearing half

`ci.yml` has a `wiki-freshness` step but **no spec-bridge step**. Removing the test without
adding one drops enforcement silently. So the CI edit is not bookkeeping — it is the reason
this change is safe, and AC #4's test (reading the real `ci.yml`) is what stops a future edit
from dropping it again.

Model that test on the existing `GATES`/`action.yml` drift check in the same file
(`run-gates.test.mjs`, "GATES registry and action.yml agree") — same shape, same rationale:
two hand-maintained surfaces tied together by a test that reads the real file.

### R3: warn without losing the signal

Restructure `pre-push` to run each check, capture output, and print findings under a heading
that states the expectation:

```
pre-push: grounding wiki freshness
  ⚠ docs/wiki/spec-bridge-plugin.md: STALE — sources changed since 38f7d25a
    Mid-PR staleness is expected before the re-pin. Re-pin before opening the PR;
    CI blocks the PR if it is still stale.
→ push proceeds
```

`set -e` is currently on and will abort on the first nonzero exit — remove or scope it, and
capture exit codes explicitly. Keep the crash/finding distinction from the constitution check
above.

### R5: retire the softening honestly

The runbook says the softening "expires when TASK-102 merges." Record the expiry *and* the
replacement in the same edit. An expiry line that only says "gone" invites reinvention the
next time someone hits a wedge; the point is that the wedge no longer exists.

## Phasing rationale

Four phases:

1. **The rule + the window computation** — doc the rule, implement the window in
   `grounding-wiki/gates/` with tests. Pure addition, nothing wired yet.
2. **Move the self-check + close the CI gap** — the highest-risk slice, isolated. Ends with
   `node --test` green on a tree that stales a note (AC #5, the proof).
3. **`pre-push` warns; `stop-docs` becomes window-aware.**
4. **Runbook expiry, docs, re-ground, versions.**

Phase 1 before 2 because phase 3 consumes the window; building it first keeps phase 3 to
wiring.

## Risks

| Risk | Mitigation |
|---|---|
| The window forgives real neglect | Per-note, and `--not origin/main` scoped; degrades **closed** on a missing ref. Both tested. |
| R3/R4 turn a crash into a warning | Distinguish findings from crashes explicitly; crash still fails. Called out in the constitution check and tested. |
| Removing the test drops spec-bridge enforcement | AC #4 — CI gains the step, and a test reads the real `ci.yml` so it can't be dropped silently. |
| `run-gates.mjs` exit codes shift | They are a versioned consumer contract (`docs/consuming-gates.md`); this spec adds a caller, not a code change. |
| AC #5 proven by argument instead of execution | It must be **executed**: stale a note on a scratch branch, run `node --test`, commit with hooks on. Record the transcript in Notes. |
| This PR is itself the first user of the new rule | Deliberate and useful — dogfood it: this branch will stale notes and must commit cleanly without `--no-verify`. |

## Verification

- `node --test` green **including** on a tree with a deliberately staled note (AC #5).
- `node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness --path .` exit 0 at Done.
- `pre-push` exits 0 with warnings on a stale tree; still fails when the gate script is
  missing (crash, not finding).
- `stop-docs.mjs` tested both sides of the window.
- `node scripts/check-docs.mjs`, `sync-version.mjs --check`, `check-version-bump.mjs` green.
- **This PR opened without a single `--no-verify`** — the practical proof the wedge is gone.
