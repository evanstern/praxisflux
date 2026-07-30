---
name: pdlc-sweep
description: The pdlc:sweep skill — board-sweep orchestrator; authors a dependency-laned, operator-signed-off runbook over board tasks — model tiers pinned to explicit model IDs, passed on dispatch — then runs each through spec → link → worktree → phase-scoped, turn-hygienic delegated implementation → PR → serial merge → re-ground, with per-task cost logs and lane-boundary session ends, under concurrency doctrine: claim-before-work, paused lanes, merge-drift gates, pin-aware reconciliation, honest re-pins.
kind: component
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: dbb062a2d090ac2c1d7af8f0e7d414a9521557cc
---

# pdlc:sweep — the board-sweep orchestrator

`skills/sweep/SKILL.md` (with its `templates/runbook.md`) — the second skill of the
[[pdlc-plugin]], added in 0.12.0 — orchestrates a **set of board tasks** into merged
PRs. The orchestrator plans, dispatches, and gates; it never implements inline. Two
phases, gate → work → gate:

- **Author:** from task ids / a label / a synthesis doc, derive dependency-ordered
  **lanes** (*develop in parallel, merge serially*; contract-shaped work leads — a
  published interface unblocks consumers), model tiers from the host rubric — each
  pinned to an explicit model ID (see below) — per-PR gates enumerated, concurrency
  doctrine with named hotspots, operator checkpoints, and a done-means — written to
  `docs/design/<slug>-runbook.md`, committed, then **stopped for operator sign-off**
  on the lanes.
- **Execute:** per task, the host PDLC loop instantiated — root freshness, then
  **claim before any spec authoring** (the branch's first commit — cut from
  `origin/main`, which does not yet contain the spec — claims the task: card → In
  Progress plus a spec-dir stub, pushed -u immediately, never force-pushed;
  rejected push = race lost: re-read board/`specs/`, surface contention, else merge
  main in and re-push — rebase-ban-safe), Spec Kit cycle on the claimed branch,
  `spec-bridge:link`, delegated phase-scoped implementation (never inline; the
  runbook's model ID on each dispatch — see below), per-PR gates, reconcile with
  `origin/main` (pin rule below), PR, serial merge (verify merged before cleanup),
  re-ground (ticks before sync — see below), one execution-log line.

Since 0.12.1 both phases consume a host **merge-drift gate** when the precondition
probe finds one (`scripts/check-merge-drift.mjs`, the promptworld spec-051 pattern;
since 0.34.0 four modes — `session`/`claim`/`worktree`/`pr` — identical in SKILL and
template, invocations verbatim): `session` at sweep start subsumes the root
fetch/ff-pull and feeds the drift matrix into lanes, `claim` blocks on a taken spec
number, `worktree` mechanizes the fresh-root/spec-number checks at cut, `pr` blocks
each `gh pr create` (re-run after every history move). The runbook records the probe
result; with no gate the raw git doctrine stands. Since 0.13.0 the template carries
the claim-before-work doctrine and the gate's checks.

Since 0.14.0 sweep's whole-corpus orientation moments (runbook authoring, each
re-ground) consume the corpus per [[grounded-corpus-spec]] v2 — `CAPSULES.md` when
present, full bodies only for touched concepts, `INDEX.md` plus just-in-time notes
on a v1 corpus.

Since 0.25.0, a **paused-lane marker**: a task labeled `paused` (set/cleared only
via `backlog task edit --labels`, provenance in an append-note, machine-findable in
frontmatter `labels:`) is not a live lane — authoring excludes it from conflict
analysis, lists it "paused — untouched"; execution never claims, rebases, or cleans
its branches/worktrees; drift-gate hosts downgrade its findings to info.

Since 0.27.0 reconciliation splits by what the branch carries (promptworld field
evidence, operator-ratified): a **pin-carrying branch** — its own commits referenced
by re-pins it carries, routine on wiki-in-PR hosts — **merges `origin/main` in**:
squash, rebase, and force-push all rewrite its hashes and stale every carried pin;
only a merge commit keeps old hashes reachable, so its PR also lands as a merge
commit, never a squash. **Pin-free branches still rebase.** After every history move
the gates AND freshness probe re-run unconditionally — never gated on whether
`docs/wiki/` changed: pins also reference files outside the wiki.

Since 0.28.0 (skill 0.7.0) the re-pin leg is honest by doctrine: 0.27.0's mechanical
"re-pin conflicted pins to the merge commit" is superseded — pin = merge commit
empties the freshness probe's range by construction, greening the gate over a note
that may contradict main-side code. A merge-in licenses no pin bump; every staled or
conflicted pin routes through the wiki-update classifier ([[grounding-wiki-plugin]])
against the main-side diff over its sources: **RE-PIN-ONLY** where the diff
provably can't invalidate prose, **NEEDS-REVIEW** where the prose is re-verified and
amended first. The merge commit is an honest re-pin's *target*, never its
*justification*. Old-convention hosts keep the merge-in, drop the mechanical re-pin,
classify-then-pin, treating previously bumped pins as suspect.

Since 0.34.0 (skill 0.8.0) the doctrine set is internally reconciled (TASK-60): the
Phase 2 loop carries an **explicit claim step** (claim commit before spec authoring;
merge-based rejected-claim remedy) identical in SKILL, template, and this note; the
drift-gate inventory matches in both files; and **ticks come before
sync** in re-ground — tick tasks.md at root, then `spec-bridge:sync`, whose derived
plan is the only path to Done on a linked task ([[spec-bridge-plugin]] doctrine) —
the sweep never hand-sets Done.

Since 0.40.0 (skill 0.9.0) Handing off names `pdlc:refactor-triage` as the
post-sweep review — evaluate the merged range for tech debt and intent drift, card
accepted findings ([[pdlc-refactor-triage]]) — closing sweep → refactor-triage →
debt tasks → next sweep.

Since 0.41.0 (skill 0.10.0) the model tier is pinned to an **explicit model ID**
(TASK-86): the runbook records the ID next to each tier label — a bare tier name has
no mechanical resolution and silently resolves to the session's model — and
dispatch passes the ID explicitly (the Agent tool's `model` param or host
equivalent), never session inheritance: an orchestrator often runs a price tier
above the implementer intent (field case: "Opus tier" implementers ran on the Fable
session model at 2x the price). The board record extends to tier + model ID +
justification.

Since 0.42.0 (skill 0.11.0) dispatch is **phase-scoped** (TASK-87): one fresh
implementer per tasks.md phase (or explicitly-grouped small adjacent phases, the
orchestrator's recorded call), each at the runbook's pinned model, re-grounded from
the **phase handoff artifact set** — the spec dir, the tasks.md tick-state, the
branch's commits. Nothing passes between phases via chat context: if the next phase
needs it, it lives in an artifact (ticked box, committed slice, deviation note).
Rationale in place: every tool call re-pays the agent's full context read; a
long-lived implementer's context is mostly its own transcript (field case: 699
requests at ~427k average context, $404, vs ~32k at dispatch; fresh restarts at
~35k). The execution log keeps it resumable: a row's `notes` slot carries phases
dispatched/completed — one slot, not a second table.

Since 0.43.0 (skill 0.12.0) three cost levers (TASK-88): every dispatch prompt
carries a **turn-hygiene block** — batch independent reads/checks as parallel tool
calls in one message, minimal between-call narration, mechanical phases at lower
reasoning effort (fewer, more consolidated calls); micro-turns re-pay the full
context read per call (field case: expensive implementers averaged ~300 output
tokens/request). The execution log gains a **tokens/cost (best-effort)** column —
actuals from the harness/transcript, so future runbooks budget against real
numbers. The orchestrator SHOULD **end its session at lane boundaries**,
resuming from runbook + board — a cost prescription, not just crash-resilience:
orchestrator context grows monotonically (field case: 172k→548k, the last fifth
costing as much as the first two-fifths).

The runbook is the **session-portable contract**: a fresh session resumes the sweep from
it plus the board alone. A runbook is an instruction-bearing artifact a session
*obeys*, so the adopt path verifies authority first — status signed-off (only the
operator flips it), committed, and board-backed — refusing anything unverifiable. Phase separation ([[skill-patterns]]) holds: sweep decides no
direction (that arrives from reorient/team-review/the operator) and writes no code.
