---
name: pdlc-sweep
description: The pdlc:sweep skill — board-sweep orchestrator; authors a dependency-laned, operator-signed-off runbook over board tasks — model tiers pinned to explicit model IDs — then runs each through claim+link → real Spec Kit artifacts → worktree → phase-scoped, turn-hygienic implementation → PR → serial merge → re-ground, under concurrency doctrine (claim-before-work, paused lanes, merge-drift gates, pin-aware reconciliation, honest re-pins) and a per-task spec+plan+tasks-or-escape-line Output gate.
kind: component
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: cf047ef9bbd56e66be7644a0907b90f11357c620
---

# pdlc:sweep — the board-sweep orchestrator

`skills/sweep/SKILL.md` (with its `templates/runbook.md`) — the second skill of the
[[pdlc-plugin]], added in 0.12.0 — orchestrates a **set of board tasks** into merged
PRs. The orchestrator plans, dispatches, and gates; it never implements inline. Two
phases, gate → work → gate:

- **Author:** from task ids / a label / a synthesis doc, derive dependency-ordered
  **lanes** (*develop in parallel, merge serially*; contract-shaped work leads — a
  published interface unblocks consumers), model tiers from the host rubric — each
  pinned to an explicit model ID, passed on every dispatch — per-PR gates enumerated
  (where **Lane-0/precondition rulings that change the per-task loop land as checkable
  gate lines, never only prose** — narrative is not read back; gate lines are),
  concurrency doctrine with named hotspots, operator checkpoints, and a done-means —
  written to `docs/design/<slug>-runbook.md`, committed, then **stopped for operator
  sign-off** on the lanes.
- **Execute:** per task, the host PDLC loop instantiated — root freshness, then
  **claim before any spec authoring** (the branch's first commit — cut from
  `origin/main`, which does not yet contain the spec — claims the task: card → In
  Progress, a spec-dir stub, **and the `spec-bridge:link` marker against that stub**,
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
  ID on each dispatch), per-PR gates plus the runbook's **"Per-task artifacts required
  before PR"** section, reconcile with `origin/main` (pin rule below), PR, serial
  merge (verify merged before cleanup), re-ground (ticks before `spec-bridge:sync`,
  whose derived plan is the only path to Done on a linked task — the sweep never
  hand-sets Done), one execution-log line.

## Standing doctrine

**Gates and orientation.** Both phases consume a host **merge-drift gate** when the
precondition probe finds one (`scripts/check-merge-drift.mjs`, four modes
`session`/`claim`/`worktree`/`pr`, invocations recorded verbatim in the runbook; absent
→ the raw git doctrine stands). Whole-corpus orientation moments (runbook authoring,
each re-ground) consume the corpus per [[grounded-corpus-spec]] v2 — `CAPSULES.md`
when present, full bodies only for touched concepts.

**Paused lanes.** A task labeled `paused` (set/cleared only via
`backlog task edit --labels`, provenance in an append-note) is not a live lane:
authoring excludes it from conflict analysis, execution never claims, rebases, or
cleans its branches/worktrees; drift-gate hosts downgrade its findings to info.

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
subscription-unavailability and the model that actually served recorded at dispatch;
implementation is **phase-scoped** — one
fresh implementer per tasks.md phase, re-grounded from the phase handoff artifact set
(spec dir, tick-state, branch commits), nothing passed via chat context; every
dispatch prompt carries a **turn-hygiene block**; the execution log carries
tokens/cost actuals; the orchestrator SHOULD end its session at lane boundaries.

**The Spec Kit step cannot degrade silently.** The claim-armed link, the named-artifact
spec cycle, and the template's per-task-artifacts section (above) close the loop the
**Output gate** proves: every scoped task Done via its own merged PR — its Spec
marker re-checked on the card at sweep end — AND its `specs/NNN-*/` containing
spec+plan+tasks — **or the runbook records an operator-signed
escape line naming the task and what stands in for the artifacts**; any sanctioned
substitute (a host's hand-authored-specs precedent included) enters as such a line,
never as a second mechanism.

The doctrine accreted release by release — merge-drift gates 0.12.1, capsule-first
orientation 0.14.0, paused lanes 0.25.0, pin-aware reconciliation 0.27.0, honest
re-pins 0.28.0, claim-step reconciliation 0.34.0, refactor-triage handoff 0.40.0
([[pdlc-refactor-triage]] as the post-sweep review), model-ID pinning 0.41.0,
phase-scoped dispatch 0.42.0, cost levers 0.43.0, Spec-Kit degradation hardening
0.44.0, doctrine-seam reconciliation 0.47.0 — [[pdlc-sweep-history]] carries the
per-release detail, field cases, and the
superseded conventions downstream hosts may have inherited.

The runbook is the **session-portable contract**: a fresh session resumes the sweep from
it plus the board alone. A runbook is an instruction-bearing artifact a session
*obeys*, so the adopt path verifies authority first — status signed-off (only the
operator flips it), committed, and board-backed — refusing anything unverifiable. Phase separation ([[skill-patterns]]) holds: sweep decides no
direction (that arrives from reorient/team-review/the operator) and writes no code.
