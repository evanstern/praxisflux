---
name: pdlc-sweep-history-recent
description: Newer half of pdlc-sweep-history's release-by-release doctrine record, split summary-style off the parent at the 8,000-char cap. Covers 0.47.0 onward — cost levers, Spec-Kit degradation hardening, doctrine-seam reconciliation — the field cases that forced each. Receives every future sweep-doctrine release. Earlier releases live in pdlc-sweep-history-early; current doctrine is pdlc-sweep.
kind: note
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: 9c4e990449912ee5e56c596794ac63e83ea4b686
---

# pdlc:sweep — doctrine history (0.43.0–)

Newer half of [[pdlc-sweep-history]]'s release-by-release record, split summary-style
when the parent neared the 8,000-char body cap. Covers 0.47.0 onward — cost levers
through doctrine-seam reconciliation — and is the child that receives every future
sweep-doctrine release. The earlier releases (0.12.1 through 0.44.0) live in
[[pdlc-sweep-history-early]]; [[pdlc-sweep]] states current doctrine.

## Release by release

Since 0.47.0 (skill 0.14.0) seven 035-038 stack seams reconcile (TASK-89): the
**execution-log cadence** agrees (step 5 in-flight row per dispatch boundary, step 10
closing row at merge); the skip-path drops "non-trivial" (only sanctioned skip = the
escape line); the **Output gate** re-checks each scoped card's Spec marker at sweep end
(template matched); the runbook gains a **fallback model ID** slot for
subscription-unavailability plus which model served (operator ruling 2026-07-31); the
template's escape-line section carries the **never-a-second-mechanism** clause; and two
redundancies trim to one home each (context-read rationale, tier-note).

Since 0.49.0 (skill 0.15.0) the sweep names a **background-job / no-main-push
execution mode** (TASK-90; field provenance: the 2026-07-30/31 sweep runbooks, including
this repo's own board-cost-test-runbook.md, whose orchestrator ran under exactly this
mode). When the orchestrator cannot push the default branch directly — a background job,
a protected-`main` host — three steps substitute: task worktrees live at the harness
isolation root `.claude/worktrees/task-<N>` (via `EnterWorktree`), not
`.worktrees/task-<N>`; post-merge closures (the tasks.md tick, `spec-bridge:sync`'s
board-Done, the runbook log row) ride the NEXT claimed task's branch instead of a root
commit; sweep-close lands via a small wrap-up PR. Reconciles explicitly with the
two-track landing rule 0.50.0 later planted. **Superseded convention:** steps 2/9/10's
assumption that board/spec commands always run from a main-tracking root — default
wording stays for the interactive case, but this mode reads the substitute clause. (Note:
`pdlc-sweep.md`'s release list still labels this doctrine "0.48.0" — the version TASK-90
targeted before a same-day collision with sibling PR TASK-80 took 0.48.0 for unrelated
refactor-triage content, forcing a restamp. 0.49.0 is what `marketplace.json`'s history
actually carries; "0.48.0" there is a stale pre-collision label, not a second release.)

Since 0.50.0 (skill 0.16.0) the **two-track landing rule** — board/bookkeeping
commits land direct on the default branch, deliverable work lands by PR — moves from an
unstated convention every praxisflux session already followed to a rule `pdlc:bootstrap`
plants (TASK-85; field case: infinitynode.media, a PDLC-bootstrapped host, spent a full
triage cycle on 2026-07-28 re-deriving a convention its own planted CLAUDE.md never
stated — its wiki asserted PR-only while all five of its board commits had gone direct).
`pdlc/templates/CLAUDE.md`'s `pdlc:peer:backlog` block gains the rule, derived from the
block's existing reason-to-approve principle (a board card carries no reviewable
decision) so it reads as one-task-one-PR applied, not an exception — including the
no-main-push degradation clause matching 0.49.0's mode. The sweep skill's mode section now
**references** the planted rule instead of anticipating TASK-85's landing, composing
rather than duplicating. **Superseded convention:** any prior host CLAUDE.md or wiki text
asserting all commits land by PR.

Since 0.51.0 (skill 0.17.0) two "precedent pretending to be exception" seams
close (TASK-79; field source: refactor-triage run praxis-2026-07-27-16-07-29, group F).
The **precondition gate** now accepts a missing `.specify/` when the host has an
established hand-authored-specs precedent recorded as one operator-signed escape line in
the runbook's "Per-task artifacts required before PR" section — one instance of the
existing 0.44.0 escape-line mechanism, never a second; seven prior praxisflux runbooks
(board-clearing through board-cost-test) already ran this way de facto. The
**gate-softening-requires-amendment rule**: plan- or implement-time softening of any
signed-off runbook gate is a runbook amendment plus an operator ping, never an
implementer decision note buried in a spec artifact — field case: specs/033's plan.md
relaxed a signed-off root-README gate to "only if check-docs demands" with no runbook
amendment, unread by any later step. **Superseded convention:** treating a recorded host
precedent as license to relax doctrine quietly in spec prose rather than the runbook
itself.

Since 0.55.0 (skill 0.19.0) the **tier rubric moved from prose to config** (TASK-106,
subsuming TASK-97): Phase 1 item 2 reads `.claude/model-tiers.json` — tier map, per-tier
model ID and scope, `defaultTier`, `escalation: true` — instead of a planted ladder, and
`tiers.mjs --check` becomes a Phase 1 precondition (a stale generated def means the IDs
about to be written into the runbook are not the IDs that would run). Tiers follow the
posture **thinking is Opus/Fable, execution is Sonnet/Haiku**, defaulting to `defaultTier`;
an escalation tier needs an operator checkpoint recorded *before* dispatch. Step 5 is
corrected: it taught passing the ID on the dispatch call, which the 2026-07-31
board-cost-test falsified. **Superseded convention:** treating either pin mechanism as
reliable — both have failed (the dispatch parameter ignored 2026-07-31 at ~2× price; the
frontmatter pin rejecting an ID the parameter resolved fine 2026-08-10, a 9router host
needing `cc/…[1m]`). The load-bearing rule is verifying the **served** model from the first
transcript before siblings launch — only it separates a cheap failed dispatch from an
expensive wrong-model one. Also: **regenerating mid-sweep needs a session restart** — the
agent registry is read at session start, so an edited tier keeps its old pin.

Since 0.57.0 (skill 0.20.0) the claim step names the **claim/board-commit boundary**
(TASK-102, spec 057): the status flip that claims a task is *deliverable* state and rides
the claim commit on the branch — two-track landing's "direct to `main`" covers notes, AC
ticks, labels, and new cards only. Splitting it leaves root and branch describing different
states; field case 2026-08-27, a by-the-book claim took the root suite 417/0 → 416/1 and
surfaced ~50 findings, one per Done-eligible spec.

## Connections

- Parent note: [[pdlc-sweep-history]] — the entry point; current doctrine is
  [[pdlc-sweep]].
- Sibling: [[pdlc-sweep-history-early]] — 0.12.1 through 0.44.0.
