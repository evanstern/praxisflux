---
name: pdlc-design-rounds
description: The pdlc:design-rounds skill — the pre-spec seam for work whose deliverable is unknowable until an operator picks among options; cadence worktree → claim → N rounds of comparable demo artifacts → operator selects → decision record → spec → hand off; the card stays In Progress across rounds and a round is a commit plus a card note, never a status change; spec number and spec-bridge:link deliberately deferred until after the decision.
kind: component
sources:
  - pdlc/skills/design-rounds/SKILL.md
verified_against: 8bbd58f3529a9953b6da6ed5ca7174f346a0239a
---

# pdlc:design-rounds — choose the direction, then spec it

`skills/design-rounds/SKILL.md` — the fourth skill of the [[pdlc-plugin]], added in
0.55.0 — owns the seam **before** the spec, where [[pdlc-sweep]]'s ordering cannot start.

## Why the order inverts

Sweep runs spec → implement → PR. That is correct when the deliverable's shape is known at
the moment the card is written. It inverts for design work: a spec authored before an
operator has chosen among options either says nothing (*"redesign the surface"*) or invents
a direction nobody picked, and the implementation then faithfully satisfies a fiction. The
skill's own framing: **a spec written before the choice is fiction.**

It ends exactly where a sweep lane expects to begin — a claimed branch carrying a decision
record and a spec written against a real answer — so the handoff needs no adapter.

## The cadence

**worktree → claim → *N rounds of comparable options → operator selects → decision record*
→ spec → hand off.** The starred middle is what nothing else in the suite modeled.

The load-bearing rule is that **a round is not a status change**. The board card sits
**In Progress** from the claim to merge, and each round lands as a commit plus a note on the
card. This follows from the same principle the gates enforce everywhere — a status can never
exceed the artifacts that prove it — read in the other direction: "we looked at three
layouts" is not a status, but neither may work in flight lag behind what it has produced.

Five phases: **CLAIM** (before any demo file exists), **GROUND** (read the constraints and
write them down — constraints discovered in round 3 invalidate rounds 1 and 2), **ROUNDS**,
**DECIDE** (the selection becomes a tracked decision record), **SPEC AND HAND OFF**.

## Two deliberate departures from sweep's claim mechanics

Both follow from the same fact — the spec's content is not knowable at claim time:

- **The spec number and `spec-bridge:link` defer to the post-decision phase.** Linking a
  card to an empty spec dir at claim time would arm the bridge's Stop gate against phases
  that have not been written, and would hold a reserved number across an open-ended number
  of rounds while concurrent sessions need one. (Sweep links at claim precisely *because*
  its spec cycle follows immediately; the reasoning is the same, applied to a different
  shape of work.)
- **The worktree is long-running.** Unlike a sweep lane's, it survives many operator
  round-trips and possibly many sessions, so its path and branch are recorded on the card
  rather than inferred from the session that cut it.

## Rules the phases encode, and the field cases behind them

- **Claim before writing anything.** Field case: a card created in the root checkout
  *before* the worktree was cut from `origin/main` never reached the branch, so the board
  CLI could not see the task from inside the worktree and the card sat stranded and
  uncommitted while the work proceeded around it. Cut the worktree first, or commit the
  card first — never neither.
- **Options must be comparable.** Options differing on many axes at once cannot be chosen
  between, only reacted to. Every option in a round shows the same content in the same
  states — including failure and refusal states, since states nobody mocks are states
  nobody designs — using the system's **real copy**, never placeholder text, because a
  direction is judged on the sentences that actually ship.
- **The rejected half of the decision record is its most valuable half.** It is what stops
  a later editor from "improving" the design back into something already considered and
  declined.
- **The operator decides; the skill records.** A run that picks a direction on the
  operator's behalf has produced the one artifact the skill exists to prevent: a design
  nobody chose.
- **Long-running means resumable.** The test: if the session ended right now, what is lost?
  The answer must be "nothing" — card notes, option files, and the decision record carry
  the state.

## Connections

- [[pdlc-plugin]] is the host plugin; [[pdlc-sweep]] is what this hands off to, and whose
  claim mechanics it deliberately departs from in two places.
- [[pdlc-refactor-triage]] closes the loop on the other end (post-merge), making the pdlc
  skills a chain: design-rounds → sweep → refactor-triage → next sweep.
- The artifact-grounded-action and one-TASK-one-PR principles it applies are planted by
  bootstrap; see [[pdlc-plugin]]'s "Rules that always hold".
