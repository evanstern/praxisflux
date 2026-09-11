---
name: pdlc-sweep
description: The pdlc:sweep skill — board-sweep orchestrator; authors a dependency-laned, operator-signed-off runbook over board tasks — model tiers pinned to explicit model IDs — then runs each through claim+link → real Spec Kit artifacts → worktree → phase-scoped, turn-hygienic implementation → PR → serial merge → re-ground, under concurrency doctrine (claim-before-work, paused lanes, merge-drift gates, pin-aware reconciliation, honest re-pins) and a per-task spec+plan+tasks-or-escape-line Output gate.
kind: component
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: ab9e2a0fd7c690f538f235134167cc0c6f7f580b
---

# pdlc:sweep — the board-sweep orchestrator

`skills/sweep/SKILL.md` (with its templates, [[pdlc-sweep-handoffs]]) — the second skill
of the [[pdlc-plugin]], added in 0.12.0 — orchestrates a **set of board tasks** into
merged PRs. The orchestrator plans, dispatches, and gates; it never implements inline.
Two phases, gate → work → gate:

- **Author:** from task ids / a label / a synthesis doc, derive dependency-ordered
  **lanes** (*develop in parallel, merge serially*; contract-shaped work leads — a
  published interface unblocks consumers), model tiers from the host rubric
  **`.claude/model-tiers.json`** (the tier map, each tier's model ID and scope,
  `defaultTier`, `escalation: true`; the planted CLAUDE.md section carries the posture and
  points at it) — assigned by that posture, **thinking is Opus/Fable-tier, execution is
  Sonnet/Haiku-tier**, defaulting to `defaultTier`, an escalation tier needing an operator
  checkpoint recorded before dispatch, each pinned to an explicit model ID;
  `tiers.mjs --check` is a Phase 1 precondition, and regenerating anything means ending the
  session first, because the agent registry is read at session start — per-PR gates enumerated
  (where **Lane-0/precondition rulings that change the per-task loop land as checkable
  gate lines, never only prose** — narrative is not read back; gate lines are),
  concurrency doctrine with named hotspots, operator checkpoints, and a done-means —
  written to `docs/design/<slug>-runbook.md`, committed, then **stopped for operator
  sign-off** on the lanes.
- **Execute:** per task, the host PDLC loop instantiated — root freshness, then
  **claim before any spec authoring** (the branch's first commit — cut from
  `origin/main`, which does not yet contain the spec — claims the task: card → In
  Progress — a **deliverable-state** flip that rides this commit, not the two-track
  board track (spec 057) — a spec-dir stub, **and the `spec-bridge:link` marker against that stub**,
  so the bridge's Stop gate is armed from the first commit rather than after the spec
  cycle it protects — armed late, it is disarmed by exactly the skip it exists to
  catch; pushed -u immediately, never force-pushed; rejected push = race lost: re-read
  board/`specs/`, surface contention, else merge main in and re-push — rebase-ban-safe),
  then the Spec Kit cycle on the claimed branch producing **three named, real
  artifacts** — `spec.md` (requirements mapped to the card's ACs), `plan.md`
  (constitution-checked; constitution absent/unratified → say so in plan.md and plan
  against the grounding docs, never ceremony), `tasks.md` (phased checkboxes the
  bridge derives from) — committed before implementation dispatches, then **link
  completion** (phase ACs seeded from tasks.md via update mode; claim's marker
  verified), delegated phase-scoped implementation (never inline; the runbook's model
  ID on each dispatch), per-PR gates plus its **"Per-task artifacts required
  before PR"** section, reconcile with `origin/main` (pin rule below), PR, serial
  merge (verify merged before cleanup), re-ground (ticks before `spec-bridge:sync`,
  whose derived plan is the only path to Done on a linked task — the sweep never
  hand-sets Done), one execution-log line.

## Standing doctrine

**Gates and orientation.** Both phases consume a host **merge-drift gate** when the
precondition probe finds one (`scripts/check-merge-drift.mjs`, four modes
`session`/`claim`/`worktree`/`pr`, invocations recorded verbatim in the runbook; absent →
the raw git doctrine stands). Whole-corpus orientation moments (runbook authoring, each
re-ground) consume the corpus per [[grounded-corpus-spec]] v2 — `CAPSULES.md` when
present, full bodies only for touched concepts.

**Paused lanes.** A task labeled `paused` (set/cleared only via `board:label`, provenance
in an append-note) is not a live lane: lane-conflict analysis resolves the label from the
`.board/links.json` mirror (`isPausedLink`, `lib/board-mirror.mjs`) rather than Backlog
frontmatter, so it holds on a mirror-only (Jira) project — authoring excludes it from
conflict analysis, execution never claims, rebases, or cleans its branches/worktrees;
drift-gate hosts downgrade its findings to info.

**Reconciliation and honest re-pins.** A **pin-carrying branch** merges `origin/main`
in and its PR lands as a merge commit, never a squash (squash/rebase/force-push rewrite
hashes and stale every carried pin); a pin-free branch rebases. A merge-in licenses no
pin bump: every staled or conflicted pin routes through the wiki-update classifier
([[grounding-wiki-plugin]]) against the main-side diff over its sources — RE-PIN-ONLY
vs NEEDS-REVIEW — the merge commit being an honest re-pin's *target*, never its
*justification*. Gates AND the freshness probe re-run after every history move,
unconditionally.

**Dispatch economics.** Tiers resolve to explicit model IDs at dispatch (a bare tier
name silently inherits the session's model), each with a fallback ID for
subscription-unavailability; the model that actually **served** is
**verified from the first dispatch's transcript rather than assumed** (both pin
mechanisms have failed in the field — see [[pdlc-sweep-history]]) and recorded on the card
as a **machine-findable line a gate reads**:
`Dispatch: tier=<tier> pinned=<model-id> served=<model-id>`, one per dispatch, `served=` a
bare ID (a placeholder does not count). A dispatched task and an inline-implemented one
leave identical commits, specs, and ticks, so that line is the only residue between them,
and a task's PR is not merge-ready without it ([[spec-bridge-plugin]]'s gate reports a
claimed card that lacks one).
Implementation is **phase-scoped** — one
fresh implementer per tasks.md phase, re-grounded from the phase handoff artifact set
(spec dir, tick-state, branch commits), nothing passed via chat context; every
dispatch prompt carries a **turn-hygiene block**; the execution log carries
tokens/cost actuals; the orchestrator SHOULD end its session at lane boundaries.

**The Spec Kit step cannot degrade silently.** The claim-armed link, the named-artifact
spec cycle, and the per-task-artifacts section (above) close the loop the **Output gate**
proves: every scoped task Done via its own merged PR — Spec marker re-checked on the card
at sweep end — AND its `specs/NNN-*/` holding spec+plan+tasks — **or the runbook records
an operator-signed escape line naming the task and what stands in for the artifacts**.
Every substitute enters as one such line — one task, one signed runbook — never as a
second mechanism. The **precondition gate** passes on `.specify/` present; absent, the
sweep stops and names `specify init` as the fix.

The doctrine accreted release by release, from merge-drift gates in 0.12.1 through the
lane-handoff template in 0.63.1 ([[pdlc-refactor-triage]] arrived at 0.40.0 as the
post-sweep review). **[[pdlc-sweep-history]] is the release index** — which rule landed
when, the field case that forced it, the superseded conventions downstream hosts may have
inherited. Re-enumerating it here drifted: that list had stalled at 0.51.0 while the
children carried 0.55.0 and 0.57.0.

**Session-portable handoffs** — [[pdlc-sweep-handoffs]]. Two templates: `runbook.md` is
the contract at a *lane boundary* (a fresh session resumes from it plus the board alone;
being instruction-bearing, the adopt path verifies its authority before obeying), and
since 0.63.1 (skill 0.23.0) `lane-handoff.md` covers resuming **mid-lane** — where the
work sits, what it proved, what it owes. That template's **shape is load-bearing**: the
reader gets the orchestrator's role and the dispatch instruction before any content,
after a field case where a tier named as a field was resumed by a session that
implemented the lane inline. Neither is `.handoff/` ([[handoff-protocol]]).

Phase separation ([[skill-patterns]]) holds: sweep decides no
direction (that arrives from reorient/team-review/the operator) and writes no code.
