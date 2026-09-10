# Spec 056 Phase 3 — the resolution quirk, VERIFIED (2026-09-10)

Spec 056 Phase 1 box 5 was deliberately left unticked at 6/7: "a set `resolution` can block a
reopen/backwards transition" was **untested**, because the 2026-09-09 sign-off covered a
description round-trip only and the permission boundary declined workflow writes. The handoff
recorded it as **owed before Phase 3** relies on backwards moves.

It is now tested, on a scratch issue this session created, under the operator's 2026-09-10
write authorization (`findings/phase-2-operator-rulings.md`, ruling 1). Issue keys and site
coordinates are omitted per finding F7.

## What was run

1. Read the available transitions on a scratch issue at `Open`.
2. Transitioned it **forward to `Closed`** (a `done`-category status).
3. Re-read the issue and its transitions.
4. Transitioned it **backwards to `Ready for Dev`** (an `indeterminate`-category status).
5. Re-read the issue.
6. Cleared `resolution` via `editJiraIssue` with an explicit `null`.

## Verdict: the backwards move is NOT blocked — but it leaves a STALE RESOLUTION

**On this workflow, a set `resolution` does not block the backwards transition.** The move
`Closed → Ready for Dev` succeeded directly, with no resolution-clearing step needed first.
The spec's stated worry does not reproduce here, so **Phase 3's write path needs no
clear-then-transition dance** for this host.

**The real finding is the one the spec did not predict.** Three facts, each read back rather
than assumed:

1. **The forward transition to `Closed` silently SET `resolution: Done`.** Nothing in the
   transition call asked for it — the workflow's post-function did it. A `resolution` field
   that was absent before the move is present after.
2. **The backwards transition did NOT clear it.** After moving to `Ready for Dev` — an
   `indeterminate`, actively-in-progress status — the issue still carried `resolution: Done`.
   That is an issue simultaneously "in progress" and "resolved as Done": internally
   inconsistent state that no gate reads today, because the mirror projects `status` and not
   `resolution`.
3. **`editJiraIssue` with an explicit `null` clears it**, and clearing does not disturb the
   status. This is the fix the spec named, and it works — it is just needed for a different
   reason than the spec assumed (hygiene after a backwards move, not unblocking one).

## What Phase 3's write path must do

**After any backwards transition out of a `done`-category status, clear `resolution`.** Not
because the move would otherwise fail — it will not — but because leaving it set produces a
card that reads as resolved while the bridge considers it unfinished. The bridge moves
statuses backwards as normal operation (a regenerated `tasks.md` legitimately un-proves a
Done claim), so this is a routine path, not an edge case.

Sequence, per the spec's two-step discipline:

```
listJiraIssueTransitions(issue)            -> find the transition whose to.name is the target
transitionJiraIssue(issue, transitionId)   -> execute by ID
if (moving OUT of a done-category status)
  editJiraIssue(issue, { resolution: null })   -> clear the post-function's leftover
```

**Resolve the transition by `id`, matched on `to.name` — never by the transition's own
`name`.** Confirmed twice over on this workflow (see `phase-2-operator-rulings.md`, live
finding 3): two transitions share the name `Ready for Dev`, and one named `Closed (2)` targets
the status `Closed`. Transition names are neither unique nor equal to their target status.

## Scope note

This is one workflow on one project. A different Jira workflow may genuinely block the
backwards move — the spec's original worry is not refuted in general, only shown not to apply
here. The clear-after-backwards step above is correct either way: it is a no-op when no
resolution was set, and the fix when one was.
