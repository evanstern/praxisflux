# Spec 070 — implementation plan

**Task:** TASK-0123 · **Spec:** `specs/070-teardown-race/spec.md`

## Constitution check

Checked against `.specify/memory/constitution.md` **v1.0.0 (ratified 2026-09-11)** — a real
check, not the absent/unratified degradation path.

| Article | Verdict |
|---|---|
| I. Artifact-Grounded Action | **PASS.** The mechanism finding and the N-run stability evidence both land as durable artifacts (card notes + this spec dir). R1 explicitly forbids asserting the hypothesis as fact if it cannot be observed. |
| II. One TASK, One PR | **PASS.** One TASK, one branch (`task-0123-teardown-race`), one PR. The phases below are internal breakdown riding this branch. |
| III. Artifact-Gated Seams | **N/A.** No pipeline-stage boundary; this is test-fixture hygiene. |
| IV. Gates: Status Never Exceeds Proven Artifacts | **PASS — the load-bearing article here.** A teardown fix must never become a route for a real failure to pass. R4 + the Phase 3 negative control exist for exactly this; AC#3's raw-count evidence is what makes the "fixed" claim provable rather than asserted. |
| V. Composition Through Files and Gates Only | **PASS.** Test-only change; no cross-plugin import. A shared test helper is suite-internal plumbing, not plugin composition. |
| VI. Advisory Local, Authoritative CI | **PASS.** The flake's cost IS the erosion of trust this article's split depends on. Fixing it strengthens the posture; nothing local becomes load-bearing. |
| VII. Grounding Freshness Is Part of Done | **PASS — check, don't assume.** Test files can be pinned sources. Phase 4 runs the freshness probe and re-pins any note listing a touched file; if none list them, that is verified, not presumed. |
| VIII. Amendment Procedure | **N/A.** |

No violations. No complexity-deviation entries required.

## Approach

**The fix: a shared teardown helper with retry-and-backoff, replacing bare `rmSync` across
the suite.** Named plainly, per R2: this is *retry-with-backoff around removal*, NOT
"the fixture stops leaving a live git dir behind."

**Why retry rather than eliminating the git dir.** The fixtures need a real repository —
they exercise `validateFreshness` against real commits, real branches and real
`rev-parse` output. A fixture that avoided leaving a live `.git` behind would have to stop
being a git repo, which would gut what these tests prove. The race is in *removal*, and
removal is where it gets fixed.

**Why `force: true` does not already handle it.** `force` suppresses errors for paths that
do not exist. It does nothing for a directory that is non-empty at the moment `rmdir` is
attempted, which is exactly the ENOTEMPTY case. This is worth stating because "we already
pass force" is the natural objection.

**Why one shared helper rather than sixteen local fixes.** The audit surface is sixteen
files (spec's Scope finding). One helper means one implementation, one place where the
retry policy is documented, and a sibling that adopts it is cleared by construction. It
also avoids sixteen slightly-different retry loops drifting apart.

**Shape:** a small helper in a shared test-support module — remove, and on ENOTEMPTY /
EBUSY / EPERM, retry a bounded number of times with a short escalating delay; give up by
re-throwing so a genuinely stuck directory is still loud. Bounded and loud, never silent:
swallowing the error would hide a real leak and trade a visible flake for an invisible one.

## Phases

- **Phase 1 — confirm the mechanism (R1).** Establish what holds the handle, from evidence:
  inspect what git leaves running/open under `.git` after these fixture operations, and try
  to reproduce under contention. **Report honestly** — if the specific holder cannot be
  observed on this platform, state what WAS established and that the fix is defensive
  against the class. Do not dress the hypothesis up as a confirmed finding.
- **Phase 2 — the shared helper (R2).** Introduce it, adopt it in
  `test/stop-docs-window.test.mjs`'s seven teardown sites.
- **Phase 3 — prove it (R3, R4).** N consecutive runs with raw counts recorded (TASK-114's
  standard is 20/20 read from real output). Plus the negative control: show the four window
  behaviours still fail when the window logic regresses, and show the control actually
  broke the thing.
- **Phase 4 — the sibling audit (R5).** Per file, adopt the helper or record why it is
  cleared. Then: freshness probe, and the release check — this is a **test-only** change,
  so per the runbook's gate list no version bump is owed; verify that rather than assume it
  (`check-version-bump.mjs --base origin/main` is the arbiter).

## Gates this PR owes

- Pre-commit: `gen-marketplace.mjs --check` · `sync-version.mjs --check` · `check-docs.mjs`
- Pre-push: `check-version-bump.mjs --base origin/main` · wiki freshness gate
- Project gates: `tests`, `docs-in-sync`, `versions-consistent`
- **No version bump expected** (test-only, `test/` is not released surface) — verified, not assumed
- Merge commit, never squash
- `Dispatch:` line on the card per dispatch, `served=` read from the transcript

## Risks

- **The proof is the expensive part, not the diff.** AC#3 wants 20/20-shaped evidence and
  AC#5 audits sixteen files. Budget accordingly; the card's own notes warn against adding a
  retry loop and calling it proven.
- **A green suite does not prove a race fixed** — the flake was already rare. The N-run
  evidence is necessary but not sufficient, and the report should say so plainly rather
  than overclaiming.
- **Do not trust a dispatch's gate claim** (TASK-0121 finding 1): re-run every gate at the
  orchestrator.
