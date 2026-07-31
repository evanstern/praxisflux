---
name: pdlc-sweep-history
description: Release-by-release doctrine history of the pdlc:sweep skill — when each rule arrived (merge-drift gates, capsule-first orientation, paused lanes, pin-aware reconciliation, honest re-pins, claim-step reconciliation, refactor-triage handoff, model-ID pinning, phase-scoped dispatch, cost levers, Spec-Kit degradation hardening), the field cases that forced it, and the superseded conventions downstream hosts may have inherited. Load when tracing a rule's origin, not for current doctrine.
kind: note
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: 3124b74cad8e8dc92899f77ad6d57dec3494fc2f
---

# pdlc:sweep — doctrine history

The sweep skill (added to the [[pdlc-plugin]] in marketplace 0.12.0) accreted its
doctrine release by release. [[pdlc-sweep]] states the current rules; this note tracks
when each arrived, the field evidence that forced it, and what superseded-convention
hosts inherited. Versions are the marketplace lockstep, with the skill's own version in
parentheses where it diverges.

## Release by release

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
merge-based rejected-claim remedy) identical in SKILL, template, and the wiki note;
the drift-gate inventory matches in both files; and **ticks come before
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

Since 0.44.0 (skill 0.13.0) the Spec Kit step cannot **degrade silently** (TASK-84;
field case: two of a twelve-task sweep shipped a claim-stub spec.md only — no plan.md,
tasks.md, or link — yet passed every gate). Four fixes: the **claim commit carries the
spec-bridge link** (marker against the stub — the bridge's Stop gate armed from the
first commit, not after the spec cycle it protects, where skipping disarmed it); step 3
names **`spec.md`/`plan.md`/`tasks.md`**, each real and committed before implementation
(absent-constitution → plan against the grounding docs, not ceremony); step 4 is **link
completion** (phase ACs seeded from tasks.md, marker verified); the template gains a
**"Per-task artifacts required before PR"** section; and the **Output gate** requires
each `specs/NNN-*/` to hold spec+plan+tasks **or** an operator-signed escape line
naming the task and stand-in — never a second mechanism. Companion: Lane-0 rulings
changing the per-task loop land as checkable runbook gate lines, not prose.

Since 0.47.0 (skill 0.14.0) seven 035-038 stack seams reconcile (TASK-89): the
**execution-log cadence** agrees (step 5 in-flight row per dispatch boundary, step 10
closing row at merge); the skip-path drops "non-trivial" (only sanctioned skip = the
escape line); the **Output gate** re-checks each scoped card's Spec marker at sweep end
(template matched); the runbook gains a **fallback model ID** slot for
subscription-unavailability plus which model served (operator ruling 2026-07-31); the
template's escape-line section carries the **never-a-second-mechanism** clause; and two
redundancies trim to one home each (context-read rationale, tier-note).
