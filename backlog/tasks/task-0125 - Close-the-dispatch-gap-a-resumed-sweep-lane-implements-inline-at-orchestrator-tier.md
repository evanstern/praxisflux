---
id: TASK-0125
title: >-
  Close the dispatch gap: a resumed sweep lane implements inline at orchestrator
  tier
status: To Do
assignee: []
created_date: '2026-09-10 14:20'
updated_date: '2026-09-10 14:30'
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
- [x] #4 Operator has triaged the four candidate fixes in docs/design/lane-4-dispatch-gap.md and the chosen combination is recorded
- [ ] #5 Any planted-block change is re-planted and its wiki note (pdlc-grounding-block) re-pinned
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @claude
created: 2026-09-10 14:30
---
OPERATOR TRIAGE 2026-09-10: **all four candidate fixes adopted.** AC #4 satisfied — the decision is recorded here and in `docs/design/lane-4-dispatch-gap.md`.

1. **Always-on block binds any implementing session.** Rewrite `pdlc/templates/CLAUDE.md`'s Model tiers section so it no longer opens "A sweep dispatches…" (which reads as description of the skill) but states a standing obligation on whoever is implementing, however they arrived — sweep, handoff doc, or direct ask. Costs a re-plant and a `pdlc-grounding-block` re-pin.
2. **Handoff template names the dispatch, not the tier.** "Model tier: sonnet" is a label a session can satisfy while working inline — exactly what happened in Lane 4. It must read "dispatch to `<tier>-implementer`", with the verify-the-served-model step attached.
3. **Dispatch gets a durable residue a gate can check.** The only fix that creates enforcement rather than better prose. The sweep already mandates an execution-log line naming which model served; require it before a task's PR is merge-ready, so "was this dispatched?" becomes a checkable artifact. This is the biggest slice — it likely wants its own spec.
4. **The inline carve-out gets an explicit boundary.** The doctrine already implies one ("the orchestrator's hands touch specs, the board, worktree/PR plumbing, and grounding docs"). Lane 4's MCP probing, the three operator rulings, and the wiki classification fell inside it; the ~12 tests and the provider/mapping code did not. Needs a hard edge — a written carve-out is also a written excuse.

Sequencing note for whoever implements: 1, 2 and 4 are prose changes to planted/template surface and can ride one PR. 3 changes enforcement and should be specced separately rather than folded in.
---
<!-- COMMENTS:END -->
