# Spec 071 — a stale board mirror fails the commit, loudly and locally

**Task:** TASK-117 · **Status:** draft · **Created:** 2026-09-14

## Problem

The bridge gate reads `.board/links.json` — TASK-110 / spec 053 made it provider-neutral by
reading that mirror instead of `backlog/` directly. **Nothing regenerates the mirror
automatically**, so it goes stale the moment anyone edits the board without remembering to
recompute it. The mirror is derived state whose `backlog` provider is
`requiresSync: false` — a deterministic recompute via `projectBacklog(root)`, no model
needed. There is no reason a human has to remember.

**Field case 1 (2026-09-08, TASK-116 sweep).** The mirror's `generatedAt` was 2026-08-28 —
eleven days old. The bridge gate faithfully reported five tasks whose board status "lagged
their specs" (TASK-109/110/111), *all of which were already correct on the live board*. Two
sessions' worth of diagnosis went into chasing phantom board drift, and an orchestrator
reported the wrong root cause once before finding it.
`node lib/board-mirror.mjs --check --root .` named the disagreement in one run.

**Field cases 2 and 3 (2026-09-14, during TASK-0121).** Twice in a single task, on the two
most routine board operations there are:
- **At the claim commit.** Flipping the card to In Progress and setting its Spec marker
  changed the projection; the mirror was not regenerated. Not cosmetic:
  `spec-bridge/gates/cli.mjs links .` could not see the task *at all*, so the bridge had no
  link to gate and the link step appeared to have failed.
- **At the phase-AC ticks.** Ticking ACs and appending notes staled it again, caught only
  because the orchestrator happened to run `--check` in a pre-PR sweep. Nothing in the
  normal commit path would have reported it.

**Field cases 4 and 5 (2026-09-14, this sweep, while claiming TASK-0131 and TASK-0123).**
The same defect, again, at both claims — the bridge could not see either task's link until
the mirror was hand-regenerated. Five occurrences now, every one of them on a routine
board write.

**Worst symptom of all (TASK-0121 finding 4):** `spec-bridge plan` reads the mirror, not
the board. A stale mirror makes an **already-completed sync re-emit its actions**, inviting
a session to re-run edits that already landed.

## The ruling this spec implements

**Operator ruling, 2026-09-14, recorded in `docs/design/full-board-sweep-runbook.md` before
any dispatch: OPTION 2 — the pre-commit hook fails on a stale mirror**, the way it already
fails on version drift. Staleness becomes loud and local rather than silently misreported.

**Option 1 (the gate self-heals in its own precondition) is rejected**: it hides the drift
it repairs. The field case above is a mirror eleven days stale that cost two sessions of
phantom-drift diagnosis — self-healing would have made that invisible rather than legible.

**The card forbids building both mechanisms.** Only option 2 is built. This spec must not
add a self-heal, an auto-regenerate-on-read, or any silent repair anywhere.

## Requirements

- **R1 — the commit path reports staleness.** A commit whose tree carries a mirror that
  disagrees with the recomputed projection fails in `.githooks/pre-commit`, in the same
  style as the existing `sync-version.mjs --check` version-drift step. (AC#1)
- **R2 — stale is distinguishable from real board drift.** A session must never mistake
  "your mirror is stale" for "your board lags your specs". The failure names which it is,
  and names its fix. (AC#2)
- **R3 — a supported regenerate entry point.** Today regenerating requires a throwaway
  script against the module, and **the obvious call is wrong**: `projectBacklog(root)`
  returns the bare links ARRAY, not a mirror object, so `writeMirror(root,
  projectBacklog(root))` writes a file with no schema envelope, which `--check` then reports
  as `unknown schema undefined` — a malformed mirror that looks like a different bug. The
  correct shape is read → replace `links` + `generatedAt` → `validateMirror` → write. A hook
  that says "regenerate it" must point at something that exists and is correct, or it fails
  R2's name-its-fix obligation. (AC#1, AC#2)
- **R4 — the `requiresSync` provider is not broken by this.** For a provider whose mirror
  cannot be recomputed locally (Jira), `--check` can only assess staleness, and the hook
  must degrade to that rather than demanding an impossible recompute. (AC#1)
- **R5 — regression test pins the mechanism.** A deliberately stale mirror produces the
  intended outcome (a blocked commit naming staleness), not a misleading status finding.
  Negative-controlled. (AC#3)
- **R6 — `bridge.mjs` is untouched.** Under the option-2 ruling this task does not enter
  Lane A's serial `bridge.mjs` chain; its footprint is `.githooks/pre-commit` plus the
  regenerate entry point and tests. (Lane consequence of the ruling)

## Non-goals

- Any self-healing or silent regeneration — explicitly rejected by the ruling.
- Changing what the bridge gate concludes about real board drift.
- Touching `spec-bridge/gates/bridge.mjs` (R6).
- Making the hook the authoritative enforcement point: hooks here are advisory/opt-in local
  pressure (constitution Article VI). This adds local legibility, not a new mandate.

## Requirement → acceptance-criterion map

| AC | Requirement |
|----|-------------|
| #1 Mirror can no longer be silently stale when the gate reads it (hook fails on staleness; decision recorded) | R1, R3, R4 |
| #2 A stale mirror is distinguishable from real board drift in the output | R2, R3 |
| #3 Regression test pins the chosen mechanism | R5 |

## Evidence at HEAD (verified 2026-09-14)

- `.githooks/pre-commit` — four steps; `sync-version.mjs --check` is the precedent R1 follows.
- `lib/board-mirror.mjs` — `readMirror`/`writeMirror`/`validateMirror`/`projectBacklog`
  exported; the `--check` CLI already separates the `requiresSync` staleness path from the
  recomputable-drift path (the distinction R2 builds on). No `--write`/`--fix` flag exists.
