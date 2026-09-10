---
id: TASK-0125
title: >-
  Close the dispatch gap: a resumed sweep lane implements inline at orchestrator
  tier
status: To Do
assignee: []
created_date: '2026-09-10 14:20'
labels:
  - pdlc
  - doctrine
  - cost
dependencies: []
priority: high
ordinal: 156000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raised by the operator on 2026-09-10 mid-execution of TASK-113 (Lane 4): the entire lane's implementation ran inline on the orchestrator's Opus session instead of being dispatched to the `sonnet` implementer the handoff explicitly assigned.

The doctrine is unambiguous — `pdlc:sweep`'s SKILL.md says the orchestrator "never implements inline" and "does not write code", the planted block says "execution is Sonnet/Haiku-tier", and `docs/design/lane-4-handoff.md` names `sonnet` with "no escalation". So this is a miss against written doctrine, not an ambiguity in it.

ROOT CAUSE (full analysis: `docs/design/lane-4-dispatch-gap.md`): the dispatch obligation lives ONLY in `pdlc/skills/sweep/SKILL.md`, and a resumed lane started from a handoff document never invokes that skill. The always-on planted block's Model tiers section opens "A sweep dispatches..." — reading as a description of the sweep skill rather than a standing obligation on whoever is implementing. The handoff names the tier but never says "dispatch", so a session can satisfy its letter (right tier named, `tiers.mjs --check` green) while doing the work itself.

Notably this failed the sweep's OWN design test — "if a decision lives only in chat, the next session doesn't have it" — with a twist: the rule was written, but in the one place a resumed session does not read.

WHY NO GATE CAUGHT IT: an inline-implemented task leaves artifacts identical to a dispatched one — same commits, specs, ticks. `tiers.mjs --check` only verifies agent definitions match config; it cannot see whether a dispatch happened. A wrong model pin is caught; a skipped dispatch is caught by nothing.

Four candidate fixes are recorded in the design doc (not decided): (1) rewrite the always-on Model tiers section to bind any implementing session, not just a sweep; (2) make the handoff template say "dispatch to <tier>-implementer" rather than naming a tier; (3) give the dispatch a durable residue so a gate can check it — e.g. require the execution-log line naming the model that served before a task's PR is merge-ready; (4) if inline is acceptable for knowledge-shaped lanes, write that carve-out with a boundary instead of leaving it to per-session judgment.

Needs operator triage on which combination to adopt before implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The dispatch obligation is stated where a resumed session actually reads it — the always-on planted block and/or the handoff template — not only in pdlc:sweep's SKILL.md
- [ ] #2 The handoff template names the DISPATCH (to <tier>-implementer), not merely the tier, so naming a tier cannot be satisfied by implementing inline
- [ ] #3 A skipped dispatch leaves a detectable residue OR the inline carve-out is explicitly written with a stated boundary — the current state where neither holds is closed
- [ ] #4 Operator has triaged the four candidate fixes in docs/design/lane-4-dispatch-gap.md and the chosen combination is recorded
- [ ] #5 Any planted-block change is re-planted and its wiki note (pdlc-grounding-block) re-pinned
<!-- AC:END -->
