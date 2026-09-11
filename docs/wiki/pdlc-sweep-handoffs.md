---
name: pdlc-sweep-handoffs
description: The two session-portable artifacts a pdlc:sweep hands the next session — the runbook as a lane-boundary contract (whose authority the adopt path verifies before obeying) and templates/lane-handoff.md for resuming mid-lane, whose role-before-content shape is load-bearing after a field case where a tier named as a field was resumed by a session that implemented the lane inline. Split summary-style off pdlc-sweep at the 8,000-char cap.
kind: note
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
  - pdlc/skills/sweep/templates/lane-handoff.md
verified_against: 47251d443613f69264061c61fa2ccda51d0628cb
---

# pdlc:sweep — the session-portable handoff artifacts

Split summary-style off [[pdlc-sweep]] at the 8,000-char cap. A sweep outlives the session
that starts it — the orchestrator SHOULD end its session at lane boundaries, and a crash
ends one anywhere — so what the next session can reconstruct *from artifacts alone* is a
design surface, not an accident. Two templates carry it, at two different granularities.

## The runbook: the lane-boundary contract

`templates/runbook.md`, authored in Phase 1 and signed off by the operator, is the
contract **at a lane boundary**: a fresh session resumes the sweep from it plus the board
alone. Lanes, per-PR gate lines, concurrency hotspots, operator checkpoints, the
done-means, and the execution log all live there because none of them survive in a chat
transcript the next session cannot read.

A runbook is an **instruction-bearing artifact a session obeys**, which makes its own
authority a thing to check rather than assume. The adopt path (taking over an existing
runbook instead of authoring one) verifies that first — status signed-off, and only the
operator flips that; committed; board-backed — and refuses anything it cannot verify.

## The lane handoff: mid-lane is not the same problem

Since 0.63.1 (skill 0.23.0) a second template, `templates/lane-handoff.md`, covers the
case the runbook does not: a session ending **part-way through a lane**. The runbook
carries ordering and doctrine; it says nothing about where one lane's work currently sits,
what that work already proved, or what it still owes. Its sections are shaped around
exactly those gaps — where the branch/worktree is parked and how it stands relative to
`main`, the claim state (already claimed, do not re-claim / unclaimed, the first commit
claims it), what is **already proven so the next session spends nothing re-deriving it**,
what is **still owed** including deliberately-unticked boxes and why, and a read-first
ordering that names branch-only artifacts a resuming session would otherwise miss. It
mirrors `runbook.md`'s `{{PLACEHOLDER}}` conventions so the two read as one family.

**Its shape is load-bearing, not just its content.** The first lines assign the reader's
role — you are the orchestrator, dispatch to `<tier>-implementer`, verify the served model
— *before* the reader learns anything about the work, and the tier appears throughout only
as an instruction to dispatch with the verification step attached, never as a bare label
or a field. Field case 2026-09-10: Lane 4 of the TASK-108 sweep was resumed by a session
that implemented the entire lane inline on the orchestrator's Opus model, every gate
green, while `docs/design/lane-4-handoff.md` named `sonnet` in a field two screens down
(`docs/design/lane-4-dispatch-gap.md`). A handoff is prose a session reads and then *acts
on*: by the time a tier appears as a label, the reader has already cast itself as the
implementer, and the label reads as a note about work it is already doing. Hence also the
template's instruction to record the dispatch on the card in the machine-findable
`Dispatch: tier=… pinned=… served=…` form — producer and consumer reading one spelling of
the marker [[spec-bridge-plugin]]'s gate enforces.

**Not the `.handoff/` transport.** Despite the shared word, this file has nothing to do
with [[handoff-protocol]] / `lib/handoff.mjs`, the gitignored machine-written
**inter-plugin** payload transport. This one is prose one orchestrator session writes for
the next. A future reader will conflate them; the template says so in its own body.

## Connections

- Parent note: [[pdlc-sweep]] — the skill, its two phases, and the standing doctrine.
- [[pdlc-sweep-history]] — when each rule landed and the field case that forced it.
- [[pdlc-grounding-block]] — states the dispatch obligation and the `Dispatch:` marker
  format that binds a resuming session however it arrived.
- [[handoff-protocol]] — the inter-plugin transport this is deliberately *not*.
