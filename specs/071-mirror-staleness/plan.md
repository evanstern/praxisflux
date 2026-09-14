# Spec 071 — implementation plan

**Task:** TASK-117 · **Spec:** `specs/071-mirror-staleness/spec.md`

## Constitution check

Checked against `.specify/memory/constitution.md` **v1.0.0 (ratified 2026-09-11)** — a real
check, not the absent/unratified degradation path.

| Article | Verdict |
|---|---|
| I. Artifact-Grounded Action | **PASS.** The mechanism was not chosen here — it is an operator ruling already recorded in the runbook, and this plan resolves the question FROM that artifact rather than re-asking it as a preference. Exactly the article's requirement. |
| II. One TASK, One PR | **PASS.** One TASK, one branch (`task-117-mirror-staleness`), one PR. Phases ride this branch. |
| III. Artifact-Gated Seams | **PASS — this is the article's own defect.** A stale mirror is a stage trusting derived state instead of re-deriving from the artifact. Making staleness loud serves it; a self-heal (option 1) would have papered over it. |
| IV. Gates: Status Never Exceeds Proven Artifacts | **PASS — and the whole point.** The mirror is derived state; the current failure mode is derived state silently outranking the board. The fix produces the missing artifact (a fresh mirror) rather than hand-editing anything. |
| V. Composition Through Files and Gates Only | **PASS.** The regenerate entry point lives in `lib/` — shared plumbing, per the repo's own split. No cross-plugin call. |
| VI. Advisory Local, Authoritative CI | **PASS — with care.** A pre-commit hook is opt-in local pressure (`core.hooksPath`), and this must not be framed as authoritative enforcement. It makes staleness legible where it is caused; CI remains the authority. Article VI is why R4's graceful degradation matters rather than being a nicety. |
| VII. Grounding Freshness Is Part of Done | **PASS — check, don't assume.** `lib/` and `.githooks/` can be pinned sources. Phase 3 runs the freshness probe and re-pins honestly. |
| VIII. Amendment Procedure | **N/A.** |

No violations. No complexity-deviation entries required.

## Approach

**Three pieces, in dependency order: the entry point, the hook step, the test.**

**1. A supported regenerate entry point (R3) — do this first.** The hook's failure message
must be able to name a real fix. Today the correct incantation is four lines against the
module and the obvious one-liner is actively wrong (writes an envelope-less mirror that
`--check` then misreports as `unknown schema undefined`). So: add a `--write` (or
equivalently-named) mode to `lib/board-mirror.mjs`'s existing CLI that performs read →
replace `links` + `generatedAt` → `validateMirror` → write, refusing to write an invalid
mirror. This is the piece that converts "regenerate it somehow" into a copy-pasteable
command, and it is what makes R2's name-its-fix obligation satisfiable.

**2. The hook step (R1, R4).** Add a step to `.githooks/pre-commit` in the established
style — an `echo` label then the check — running `board-mirror.mjs --check`. `set -e` at
the top means a nonzero exit already blocks the commit; no new failure plumbing is needed.
Place it alongside the other `--check` steps rather than before `node --test`, so a
fast-failing correctness check isn't hidden behind the slow suite... **but** consider that
the suite is already first and is the slowest step; state your placement choice and reason.

**3. The distinguishing output (R2).** The `--check` CLI already separates its two failure
modes: `stale — <reason>` for a `requiresSync` provider versus `mirror drifted from the
recomputed "<provider>" projection` for a recomputable one. That distinction exists; what
it lacks is the fix clause. Whatever wording lands, a session reading it must be unable to
confuse it with the bridge gate's "task status lags its spec" finding — the phantom-drift
failure this card exists to end.

**Hard constraint, from the ruling:** no self-heal. The hook reports and blocks; it never
regenerates on the session's behalf. The regenerate entry point is a command a human or
orchestrator runs deliberately, never something the hook invokes.

## Phases

- **Phase 1 — the regenerate entry point (R3).** The `--write` mode on the existing CLI,
  envelope-correct and validating before write. Refuses to write an invalid mirror.
- **Phase 2 — the hook step + distinguishing output (R1, R2, R4).** Wire it into
  `.githooks/pre-commit`; make the failure name staleness-vs-drift AND its fix (the Phase 1
  command). Verify the `requiresSync` path degrades rather than demanding an impossible
  recompute.
- **Phase 3 — prove it and close (R5).** Regression test: a deliberately stale mirror
  yields a blocked commit naming staleness, negative-controlled (show the assertion fails
  when the hook step is absent, and that the control actually broke the thing). Then
  release obligations: `lib/` is released surface ⇒ **a version bump is owed**; re-stamp the
  planted block per TASK-0121 finding 3 (two-file one-line re-stamp, NOT `plant.mjs
  --force`); honest wiki re-pin; freshness probe re-run after every history move.

## Gates this PR owes

- Pre-commit: `gen-marketplace.mjs --check` · `sync-version.mjs --check` · `check-docs.mjs`
  — plus, after Phase 2, the new mirror step (this PR's own commits will run it)
- Pre-push: `check-version-bump.mjs --base origin/main` · wiki freshness gate
- Project gates: `tests`, `docs-in-sync`, `versions-consistent`
- **Version bump owed** — `lib/` is released surface
- Merge commit, never squash
- `Dispatch:` line on the card per dispatch, `served=` read from the transcript

## Risks

- **A new pre-commit step slows and can block every commit in the repo, including this
  PR's own.** Get the `requiresSync` degradation right (R4) or a Jira-provider host cannot
  commit at all. This is the risk that makes R4 load-bearing rather than defensive.
- **Both Lane B tasks make the local commit path stricter** (runbook). Merges are sequenced
  so a failure is attributable to one of them, not both.
- **The version bump cascades** (TASK-0121 finding 2): bumping the marketplace touches every
  plugin's `plugin.json` and `action.yml`'s npm pin — pinned sources for ~11 notes. Expect
  more than one re-pin pass.
- **Do not trust a dispatch's gate claim** (TASK-0121 finding 1): the orchestrator re-runs
  every gate itself.
