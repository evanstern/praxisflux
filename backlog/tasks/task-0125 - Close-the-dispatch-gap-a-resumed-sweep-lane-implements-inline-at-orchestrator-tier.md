---
id: TASK-0125
title: >-
  Close the dispatch gap: a resumed sweep lane implements inline at orchestrator
  tier
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-10 14:20'
updated_date: '2026-09-10 17:00'
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

Spec: specs/066-dispatch-gap
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fixes 1 and 2 land: the dispatch obligation is stated in the always-on planted block AND the handoff template, binding any implementing session however it arrived — not only in pdlc:sweep's SKILL.md
- [ ] #2 Fix 5 lands: the handoff template's OPENING LINE fixes the reader's role ("you are the orchestrator for this lane, not its implementer; dispatch to <tier>-implementer") before the reader learns what the work is — role before content, not a tier field in a table
- [ ] #3 Fix 3 lands and is SUFFICIENT on its own terms: a task's PR is not merge-ready until its board task carries a dispatch record naming the model that actually served. Fails closed — no record, no merge. Reuses the tier+model+justification record sweep already mandates and the card the gate already reads; no new surface
- [ ] #4 REJECTED, recorded as rejected: the inline carve-out (old candidate 4). 'Knowledge-shaped' is no boundary — any lane can be argued into it after the fact, legitimizing exactly the Lane 4 miss. Precedent against: sweep-cost-levers-runbook.md dispatched TASK-86/87/88, all pure doctrine edits, to an opus implementer. If inline is ever right it is an operator checkpoint recorded BEFORE the work — same shape as escalation
- [x] #5 Operator has triaged the candidates and the chosen set is recorded
- [ ] #6 Any planted-block change is re-planted and its wiki note (pdlc-grounding-block) re-pinned
- [ ] #7 Spec phase: Phase 1 — Verify the premises, then the doctrine prose (R1, R4)
- [ ] #8 Spec phase: Phase 2 — The lane-handoff template (R2, R5)
- [ ] #9 Spec phase: Phase 3 — The dispatch record and its fail-closed check (R3)
- [ ] #10 Spec phase: Phase 4 — Re-plant and re-pin (R6) — MUST precede Phase 5
- [ ] #11 Spec phase: Phase 5 — The upgrade path (R7) — AFTER Phase 4
- [ ] #12 Spec phase: Phase 6 — Release obligations and close (all ACs)
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

author: @claude
created: 2026-09-10 14:48
---
AMENDED 2026-09-10 after review by a sister session that independently flagged this issue. Four points raised; three adopted outright, one reversing an earlier decision. The ACs above are rewritten accordingly — the original "four candidates, pick a combination" framing is superseded.

**1. The fixes are not alternatives — ADOPTED, and this is the important correction.** 1+2 are *necessary*; only 3 is *sufficient*. Doctrine placement closes the honest miss but leaves the gap open to a session under pressure; only a residue makes a skipped dispatch detectable. The old AC #3 read "residue OR carve-out", which let the cheap half satisfy it — exactly the failure mode of naming a tier and then implementing inline. Now separate, both-required ACs.

**2. The residue already exists in doctrine — ADOPTED, and cheaper than what I proposed.** I had suggested the runbook execution-log line. Better: sweep ALREADY requires tier + model ID + justification recorded on the board task at dispatch time. So the rule is "a task's PR is not merge-ready until its board task carries a dispatch record naming the model that served." The check reads a card the gate already reads, needs no new surface, and fails closed. Strictly better than an execution-log convention, which is prose in a doc nothing parses.

**3. A FIFTH candidate, and the highest-leverage one — ADOPTED as its own AC.** Make the handoff document itself the dispatch. The gap opens because a handoff is prose a session reads and then acts on: by the time the resumed session reaches a "Model tier: sonnet" field, it is already the implementer. Putting "you are the orchestrator for this lane, not its implementer; dispatch to <tier>-implementer" as the OPENING LINE fixes the role before the reader knows what the work is. This targets the actual mechanism — role ambiguity at resume — rather than missing information, and it is the precise diagnosis of what happened in Lane 4.

**4. Do not write the inline carve-out — ADOPTED, REVERSING the earlier decision to adopt candidate 4.** The cited precedent is stronger than stated: `docs/design/sweep-cost-levers-runbook.md` dispatched TASK-86, TASK-87 and TASK-88 — all pure doctrine/prose edits to SKILL.md — to an *opus implementer* rather than inline, logging subagent token counts for each. The repo's own history already refutes "knowledge-shaped work is orchestrator work." A boundary defined as "knowledge-shaped" is not a boundary. If inline is ever correct it should be an operator checkpoint recorded BEFORE the work — structurally identical to escalation, which this repo already handles that way.

This supersedes candidate 4 in my earlier comment and the corresponding paragraph in `docs/design/lane-4-dispatch-gap.md`, updated in the same commit.

**Caveat raised, already resolved:** the sister session noted `docs/design/lane-4-dispatch-gap.md` was unreachable from `origin/main` (commit 1ddccb5). Accurate when written; it rode PR #140, merged as `fbe5b4c`, and is on `main` now — verified with `git merge-base --is-ancestor`. No dangling reference remains.
---

author: @claude
created: 2026-09-10 15:18
---
SWEEP CLAIM 2026-09-10 — runbook `docs/design/dispatch-gap-runbook.md` (signed off), branch `task-0125-dispatch-gap`, spec `specs/066-dispatch-gap`.

**Spec number: 066, not 063.** A sibling sweep (`docs/design/sweep-cost-offload-runbook.md`, signed off `390ca61`) is in flight over TASK-0126/0124/0127 and reserves 063/064/065. It also declares `.claude-plugin/marketplace.json` + every `plugin.json` version field and `CLAUDE.md` as hotspots — the same files this task's version bump and re-plant touch, so expect version-file conflicts and reconcile by merging `origin/main` in (this branch is pin-carrying; never rebase/squash/force-push).

**OPERATOR RULINGS at sign-off — these supersede comment #1's sequencing note:**

- **R1 — ONE PR, all four fixes.** Comment #1 said fix 3 "should be specced separately"; the operator ruled fixes 1, 2, 3 and 5 ride one spec dir, one branch, one PR. One TASK = one PR.
- **R2 — re-plant in the SAME PR.** AC #6's `CLAUDE.md` re-plant and `pdlc-grounding-block` re-pin ride this PR, not a follow-up.
- **R3 — the downstream upgrade path is IN SCOPE** (raised mid-authoring): downstream dependants need a documented way to update a stale planted block. Landed as runbook gate lines R3a (write the instructions in `docs/releasing.md`, which says nothing about re-planting today), R3b (make staleness discoverable), R3c (keep it distinct from fix 3's dispatch record — separate rules over separate artifacts).
- **R3b DECIDED — `plant --check` must EXIT NONZERO on a drifted block.** Shown that this is a breaking released-surface change for downstream CI, the operator ruled: *"yes, we need to stop the bleed."* Requires a breaking-change version bump, an explicit warning in the R3a instructions, and tests on both exit paths. `--check` stays read-only; only its exit status changes.
- **R4 — SEQUENCING:** re-plant `CLAUDE.md` BEFORE wiring the new exit code, or the new gate fails this repo immediately (see F1).

**FINDINGS from the precondition probes (full text in the runbook):**

- **F1 — praxis's own planted block is 6 versions stale and nothing says so.** `.pdlc` records `version: 0.57.0`; the marketplace is at v0.63.0. `plant --check` prints `claudeMd: "drifted"` and **exits 0**. This is the same defect shape as the dispatch gap itself: written doctrine, detectable drift, no residue a gate enforces. It is why R3b was ruled a requirement rather than a checkpoint.
- **F2 — there is NO lane-handoff template in the repo.** `lane-4-handoff.md` and `jira-board-handoff.md` are hand-authored one-offs; `docs/handoff-protocol.md` + `lib/handoff.mjs` are the unrelated inter-plugin `.handoff/` transport. ACs #1/#2 require CREATING a template (natural home `pdlc/skills/sweep/templates/`), not editing one.
- **F3 — fix 3 needs no new surface.** `parseLinkedTask` (`lib/board-mirror.mjs:361`) already parses a linked card's raw text and `checkBridge` already walks every linked card, so the dispatch record is checkable by the gate that already reads it — corroborating comment #2's choice of the board-task record over the execution-log line.

**Sufficiency tests written into the runbook, because both ACs are easy to fake:** AC #4 needs a POSITIVE written rejection record (silence does not tick it), and AC #3 must FAIL CLOSED — a check that reports a missing dispatch record, not documentation of the expectation.
---

author: @claude
created: 2026-09-10 17:00
---
CORRECTION 2026-09-10 — finding F1 in comment #3 is WRONG, and ruling R3b's mechanism with it. Recorded here because comment #3 is what a resuming session reads.

**What #3 claimed:** `plant --check` "prints `claudeMd: \"drifted\"` and **exits 0**", so a stale planted block is silent — and therefore making it exit nonzero would be a breaking released-surface change for downstream CI.

**What is actually true:** `node pdlc/scripts/plant.mjs --root . --peer backlog --check` **exits 1** on this repo's drifted block. `pdlc/scripts/plant.mjs:324` has carried `if (check && pending) process.exit(1)` all along, with `pending` covering `claudeMd !== "unchanged"` and `modeSwitch === "drifted"`.

**Why I got it wrong:** the probe piped node's output to `head`, so the shell reported `head`'s exit status rather than node's. My own measurement error, not a repo defect.

**What this changes:**

- **The operator's ruling stands in intent** — *"we need to stop the bleed"* — but it was ruled against a misdescription I gave them. There is **no breaking change** to make.
- **The real gap is INVOCATION, not the exit code.** Nothing runs `plant --check`: not `.github/workflows/ci.yml`, not a git hook, not `scripts/check-docs.mjs` (verified by grep over `.github/`, `.githooks/`, `scripts/`). A working gate that no surface invokes is why this repo has been running a v0.57.0 block against a v0.63.0 marketplace — six versions stale — unnoticed. R7b is therefore **wiring an existing check**.
- **Two obligations are WITHDRAWN** with the false premise: the breaking-change version bump, and the "downstream CI may start failing" warning in the upgrade instructions. An ordinary version bump applies.
- **`plant --check`'s exit-code contract must NOT be changed** — it is already correct.
- **The R4 sequencing constraint is unaffected:** praxis's own block is drifted right now, so the re-plant (Phase 4) still must land before the check is wired (Phase 5), or the newly-wired gate fails this repo immediately. That ordering came from the drift, not from any exit-code change.

The correction is carried in `docs/design/dispatch-gap-runbook.md` (finding F1, its status line, the amended R3b gate line, R4, and the checkpoint list) and in `specs/066-dispatch-gap/{spec,plan}.md`, committed as `8981f68`. tasks.md Phase 1 makes the implementer re-verify the measurement first-hand — with no pipe — before building on it in either direction, and STOP if it comes back 0.
---
<!-- COMMENTS:END -->
