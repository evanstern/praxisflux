---
name: pdlc-sweep
description: The pdlc:sweep skill — the board-sweep orchestrator; authors a dependency-laned, operator-signed-off runbook over board tasks — each model tier pinned to an explicit model ID, passed on dispatch (never session inheritance) — then executes each through spec → link → worktree → phase-scoped delegated implementation → PR → serial merge → re-ground, under concurrency doctrine for shared repos: claim-before-work, paused lanes, merge-drift gates, pin-aware reconciliation, honest re-pins.
kind: component
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: afd80f5e427dd3d209a3a1ad8e84c35ac325ad24
---

# pdlc:sweep — the board-sweep orchestrator

`skills/sweep/SKILL.md` (with `skills/sweep/templates/runbook.md`) — the second skill of
the [[pdlc-plugin]], added in 0.12.0 — orchestrates a **set of board tasks** into merged
PRs. The orchestrator plans, dispatches, and gates; it never implements inline. Two
phases, gate → work → gate:

- **Author:** from task ids / a label / a synthesis doc, derive dependency-ordered
  **lanes** (*develop in parallel, merge serially*; contract-shaped
  work leads — a published interface unblocks consumers), per-task model tiers from the
  host rubric — each pinned to an explicit model ID (see below) — the project's per-PR
  gates enumerated, concurrency doctrine with named
  hotspots, operator checkpoints, and a done-means — written to
  `docs/design/<slug>-runbook.md`, committed, then **stopped for operator sign-off** on
  the lanes.
- **Execute:** per task, the host PDLC loop instantiated — root freshness, then
  **claim before any spec authoring** (an explicit loop step: the branch's first
  commit — cut from `origin/main`, which does not yet contain the spec — claims the
  task: board card → In Progress plus the spec number's directory stub, pushed -u
  immediately, never force-pushed; a rejected push means the race was lost: re-read
  the board/`specs/`, surface contended work to the operator, otherwise merge
  `origin/main` in and plain re-push — rebase-ban-safe), Spec Kit cycle on the claimed branch, `spec-bridge:link`, delegated
  phase-scoped implementation (never inline; the runbook's model ID on each
  dispatch — see below), per-PR gates, reconcile with `origin/main` (see the
  pin rule below), PR, serial merge with verify-merged-before-cleanup, re-ground
  (ticks before sync — see below), one execution-log line.

Since 0.12.1 both phases consume a host **merge-drift gate** when the precondition probe
finds one (`scripts/check-merge-drift.mjs`, the promptworld spec-051 pattern; since
0.34.0 the probed inventory is four modes — `session`/`claim`/`worktree`/`pr` —
identical in SKILL and runbook template, invocations recorded verbatim):
`session` at sweep start subsumes the root fetch/ff-pull and feeds its drift matrix
into lane construction, `claim` blocks on a taken spec number, `worktree` mechanizes
the fresh-root and spec-number checks at worktree cut, and `pr` blocks each
`gh pr create` (re-run after every history move) on predicted conflicts. The runbook
records the probe result; with no gate the raw git doctrine stands. Since 0.13.0 the
runbook template's concurrency doctrine carries the fuller claim-before-work doctrine
above and names the gate's mechanical checks.

Since 0.14.0 sweep's two whole-corpus orientation moments (runbook authoring's project
reading, each task's re-ground) consume the corpus per [[grounded-corpus-spec]] v2 —
`CAPSULES.md` when present, full note bodies only for touched concepts, `INDEX.md` plus
just-in-time notes on a rollup-less v1 corpus.

Since 0.25.0, a **paused-lane marker**: a task labeled `paused` (set/cleared only via
`backlog task edit --labels`, provenance in a pause-time append-note, machine-findable
in frontmatter `labels:`) is not a live lane — authoring
excludes it from lane conflict analysis, lists it "paused — untouched"; execution never
claims, rebases, or cleans its branches/worktrees; merge-drift hosts downgrade its
findings to info.

Since 0.27.0 the concurrency doctrine splits reconciliation by what the branch carries
(promptworld field evidence, operator-ratified): a **pin-carrying branch** — its own
commits referenced by re-pins it carries, routine on wiki-in-PR hosts — **merges
`origin/main` in**: squash, rebase, and force-push all rewrite the branch's hashes and
stale every carried pin at once; only a merge commit keeps the old hashes reachable,
so its PR also lands as a merge commit, never a squash. **Pin-free branches still
rebase.** After every history move the gates AND the freshness probe re-run
unconditionally — never gated on whether `docs/wiki/` changed: pins also reference
files outside the wiki, so a wiki-untouched diff can still be stale.

Since 0.28.0 (skill 0.7.0) the re-pin leg is honest by doctrine: 0.27.0's mechanical
"re-pin conflicted pins to the merge commit" is superseded — pin = merge commit
empties the freshness probe's `git log <pin>..HEAD -- <sources>` range by
construction, greening the gate over a note that may contradict main-side code. A
merge-in licenses no pin bump; every stale or conflicted pin routes through the
wiki-update classifier ([[grounding-wiki-plugin]]) against the main-side diff over
the note's sources: **RE-PIN-ONLY** where the diff provably can't
invalidate prose, **NEEDS-REVIEW** where the prose is re-verified and amended before
any bump. The merge commit remains an honest re-pin's *target*, never its
*justification*. Downstream hosts on the old convention keep the merge-in, drop the
mechanical re-pin, classify-then-pin, treating previously bumped pins as suspect.

Since 0.34.0 (skill 0.8.0) the doctrine set is internally reconciled (TASK-60): the
Phase 2 loop carries an **explicit claim step** (claim commit before spec authoring;
merge-based rejected-claim remedy) identical in SKILL, template, and this note; the
drift-gate inventory is
the same four modes in both files; and the **re-ground step orders ticks before
sync** — tick the spec's tasks.md at root, then `spec-bridge:sync`, whose derived
plan is the only path that moves a linked task to Done ([[spec-bridge-plugin]]
doctrine) — the sweep never hand-sets Done on a linked task.

Since 0.40.0 (skill 0.9.0) Handing off names `pdlc:refactor-triage` as the post-sweep
review step — evaluate the merged range for tech debt and intent drift, card accepted
findings back onto the board ([[pdlc-refactor-triage]]) — closing the loop sweep →
refactor-triage → debt tasks → next sweep.

Since 0.41.0 (skill 0.10.0) the model tier is pinned to an **explicit model ID**
(TASK-86): the runbook records the ID next to each tier label — a bare tier name has
no mechanical resolution and silently resolves to the orchestrator session's model —
and dispatch passes the ID explicitly (the Agent tool's `model` param or the host's
equivalent), never session-model inheritance: an orchestrator often runs a price tier
above the implementer intent (field case: "Opus tier" implementers ran on a Fable
orchestrator's session model at 2x the unit price). The board dispatch record extends
to tier + model ID + justification.

Since 0.42.0 (skill 0.11.0) dispatch is **phase-scoped** (TASK-87): one fresh
implementer per tasks.md phase — or per explicitly-grouped small adjacent phases,
the orchestrator's recorded call; default one per phase — each at the runbook's
pinned model, re-grounded from the **phase handoff artifact set**: the spec dir
(spec.md, plan.md, tasks.md), the tasks.md tick-state, and the branch's commits.
Nothing passes between phases via chat context — if the next phase needs it, it
lives in an artifact (ticked box, committed slice, deviation note). Rationale,
stated in-place: every tool call re-pays the agent's full context read, and a
long-lived implementer's context is mostly its own transcript (field case: 699
requests at ~427k average context — $404 — vs a ~32k dispatch baseline;
fresh-per-phase restarts at ~35k). The runbook execution log keeps it resumable: a
row's `notes` slot carries phases dispatched/completed — one slot, not a second
table.

The runbook is the **session-portable contract**: a fresh session resumes the sweep from
it plus the board alone. A runbook is an instruction-bearing artifact a session
*obeys*, so the adopt path verifies authority first — status verifiably signed-off
(only the operator flips draft → signed-off), committed, and board-backed — refusing
anything unverifiable. Phase separation ([[skill-patterns]]) holds: sweep decides no
direction (that arrives from reorient/team-review/the operator) and writes no code.
