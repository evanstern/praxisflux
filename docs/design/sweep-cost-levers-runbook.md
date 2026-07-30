# Sweep cost levers (TASK-86..88) — sweep runbook (2026-07-30)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — merging serially (this sweep's single lane is fully serial;
see Lanes). Direction is decided; do not re-litigate it: the three board cards
(TASK-86..88, commit 26e1882) ARE the synthesis — each embeds the findings of the
sweep-dat-board cost analysis (promptworld session b129d47c, 2026-07-29→30, $1,192.57
total; the analysis doc lives in the promptworld project, the cards carry the numbers).
Plan-of-record is the board; this file carries only ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-07-30 (PR #99 review)
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

**Bootstrap note (this sweep edits the sweep skill itself):** the executing orchestrator
follows the doctrine as it stands at execution time (sweep 0.9.0 at authoring), not the
doctrine being authored mid-sweep — but it SHOULD already apply the cost levers the cards
prescribe, since they are operational choices, not doctrine changes: pin the explicit
model ID below at every dispatch (TASK-86's lever), dispatch fresh implementers per
tasks.md phase rather than one long-lived agent (TASK-87's lever — trivially satisfied
here, each task is a small doctrine edit), and put the turn-hygiene block in every
implementer prompt (TASK-88's lever).

## Read first (in this order)

1. The three task cards (`backlog task view TASK-86|87|88 --plain`) — direction source;
   each Description embeds its slice of the cost analysis with the estimated savings.
2. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time — expect only
   `docs/wiki/pdlc-sweep.md` (its sources are exactly the two files every task edits)
   and, at re-pin time, whichever notes the version-stamp churn stales.
   `docs/releasing.md` (bump rules); `docs/task-courses.md` (courses are per-feature —
   none of these tasks triggers one).
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. The task you're about to execute (`backlog task view TASK-<n> --plain`).

## State when this runbook was written (2026-07-30, main @ 26e1882, v0.40.0, sweep skill 0.9.0)

- **Done already:** refactor-triage run praxis-2026-07-27-17-33-15 (TASK-81..83 carded);
  demo-rig removal (c2a8fbb) + overview re-pin (9d5b81d); TASK-86..88 carded (26e1882).
- **In flight in other sessions (do not duplicate; expect their merges):** none — board
  shows no In Progress tasks. To Do cards TASK-84 and TASK-79 target the SAME files as
  this sweep (see Operator checkpoints).
- **Paused — untouched (`paused` label in the task's frontmatter `labels:`; excluded
  from lane conflict analysis; never claim, rebase, or clean their
  branches/worktrees):** none.
- **Queued (this runbook's scope):** TASK-86 → TASK-87 → TASK-88 (fully serial).

## Execution lanes (dependency-ordered)

This sweep has **one fully serial lane** — no parallel development. All three tasks edit
the same regions of the same two files (`pdlc/skills/sweep/SKILL.md` step 5 / dispatch
doctrine, and `pdlc/skills/sweep/templates/runbook.md`), plus the version lockstep files
and the same wiki note; and TASK-87 and TASK-88 both hard-depend on TASK-86. Parallel
worktrees here would guarantee conflicts in the exact sections under edit. Each task
runs claim → spec → link → implement → PR → merge → re-ground to completion before the
next starts.

**Lane 1 — TASK-86 first (contract-shaped: it establishes the tier→model-ID resolution
rule the other two build their doctrine on):**
- **TASK-86 (default implementer · model `claude-opus-5`, Agent param `opus` — doctrine
  prose on a procedural skill, no code; Opus-tier suffices at half Fable's unit price,
  which is this task's own finding)** — SKILL.md Phase 1 item 2 + step 5 + template gain
  the explicit-model-ID-per-tier rule; never session-model inheritance.

**Lane 2 — TASK-87, only after TASK-86 has MERGED:**
- **TASK-87 (default implementer · model `claude-opus-5`, Agent param `opus` — same
  rubric)** — step 5 phase-scoped dispatch doctrine: fresh implementer per tasks.md
  phase, handoff artifact set named (spec dir, tasks.md tick-state, branch commits;
  nothing via chat context), template accommodates multi-phase dispatch.

**Lane 3 — TASK-88, only after TASK-87 has MERGED (tail; least structural — droppable
only with operator say-so):**
- **TASK-88 (default implementer · model `claude-opus-5`, Agent param `opus` — same
  rubric)** — turn-hygiene block for implementer prompts (batched parallel tool calls,
  minimal narration, lower effort on mechanical phases), execution-log tokens/cost
  column, orchestrator session-boundary-at-lane-ends prescription. 87 before 88 because
  88's turn-hygiene block lands inside the dispatch guidance 87 reshapes.

**Model pinning is mandatory at every dispatch (per TASK-86's finding, applied to this
sweep itself):** pass the model explicitly to the implementer Agent call — never let
dispatch inherit the orchestrator session's model (a Fable orchestrator silently doubles
implementer unit cost). Record tier + model ID + rubric justification on each board task
at dispatch (one-way escalation only; escalations are operator checkpoints).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-07-30: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: fetch + ff-only pull at root before each task; every worktree
  cut from fresh `origin/main`.
- **Spec Kit: `.specify/` absent — host precedent stands for the whole sweep**
  (board-clearing → downstream-bugfix → sweep-followups → refactor-triage → demo-rig
  runbooks): hand-authored `specs/NNN-slug/{spec,plan,tasks}.md` + `spec-bridge:link`
  BEFORE implementation. Next free number at authoring: **035**; claim-before-work
  governs numbers — check `origin/main:specs/` at claim time; renumber on collision.
- `node --test` green in the worktree, and again after every history move.
- `scripts/check-docs.mjs` + wiki freshness gate (hard v2: capsules ≤500 chars, note
  bodies ≤8,000, CAPSULES.md regenerated in the same slice as any `description:` change).
- **Version bump gate: all three tasks touch `pdlc/` (released surface)** → marketplace
  bump via `node scripts/sync-version.mjs <next>` at each merge-readiness
  (0.40.0 → 0.41.0 → 0.42.0 → 0.43.0 if nothing else lands; readiness wins over
  prediction) + the sweep skill's own `version:` (0.9.0 at authoring) bumps in every PR —
  minor bumps: each is a behavior-visible doctrine change. If another session lands a
  sweep-skill bump mid-sweep (TASK-79 was pre-labeled "sweep 0.10.0"), take the next
  free number; the label is not a reservation.
- **Same-PR wiki re-pins:** `docs/wiki/pdlc-sweep.md` is NEEDS-REVIEW in EVERY PR — its
  sources are exactly the two files under edit, so re-verify and amend its prose against
  the actual diff before re-pinning (its capsule/description will likely change →
  CAPSULES.md regenerates in the same slice). Version-stamp churn may stale
  build-and-release / release-pipeline / pdlc-plugin notes — classify against the diff;
  stamp-only churn is RE-PIN-ONLY.
- NO per-task courses (per-feature policy). Merge commits only; one TASK one PR;
  task-id-led commit subjects with the Co-Authored-By trailer.
- **Turn-hygiene block rides every implementer dispatch prompt (this sweep applies
  TASK-88's lever from the start):** send independent reads/checks as batched parallel
  tool calls in a single message; minimal between-call narration; mechanical phases at
  low effort.

## Concurrency & conflict doctrine

- **Hotspots:** `pdlc/skills/sweep/SKILL.md` and `pdlc/skills/sweep/templates/runbook.md`
  (all three PRs, same regions — the serial lane exists for this); version lockstep
  files (`.claude-plugin/marketplace.json`, every `plugin.json`, `action.yml` npx pin,
  sweep SKILL.md `version:`); `docs/wiki/pdlc-sweep.md` + `INDEX.md` + `CAPSULES.md`.
- **Paused tasks are not live lanes:** a task labeled `paused` (set/cleared only via
  `backlog task edit --labels`, provenance in its append-notes) is listed in the state
  snapshot above and NEVER claimed, rebased, or cleaned — its branches and worktrees
  belong to the pausing operator. (None at authoring.)
- Reconcile by what the branch carries: every branch in this sweep is **pin-carrying**
  (each re-pins `docs/wiki/pdlc-sweep.md` to its own commits) → **merge `origin/main`
  in**, never rebase; the PR lands as a merge commit, never a squash. Take main's side
  for anything you didn't deliberately change.
- **Honest re-pins only — a merge-in never justifies a pin bump.** Route every pin the
  merge staled or conflicted through the wiki-update plan loop: read the main-side diff
  over the note's sources (`git diff <old-pin>..<merge-commit> -- <sources>`), classify
  RE-PIN-ONLY (provably prose-safe) vs NEEDS-REVIEW (re-verify and amend the note's
  prose against that diff BEFORE bumping). The merge commit is the re-pin *target* once
  the note is verified, never the *justification*.
- After every history move (merge-in or rebase): re-run gates AND the freshness probe
  unconditionally — never gated on whether `docs/wiki/` changed.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress AND the spec number's directory (a stub claims the number) — before any
  spec authoring or code. The claim rides the task branch, cut from `origin/main`
  (`git worktree add .worktrees/task-<N> -b task-<N>-<slug> origin/main`). Push
  immediately (`git push -u origin <branch>`); never force-push a claim.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  If another session now holds that task or number, STOP the lane and surface it to the
  operator. Unrelated rejection with the task+number still free → fetch, merge
  `origin/main` into the claim branch, and re-push — a plain push, never a force-push.
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head.
- Board/spec commands run from ROOT, never inside a worktree; add specific task files
  to git, never `backlog/` wholesale.
- **Orchestrator session boundaries (TASK-88's lever, applied now):** the orchestrator
  SHOULD end its session at each lane boundary (here: after each merged task, since
  lanes are single-task) and resume from this runbook + the board — the runbook is the
  session-portable contract; a 500k-context orchestrator is the failure mode these
  cards exist to kill.

## Operator checkpoints (do not proceed silently)

- **Footprint collision with out-of-scope cards:** TASK-84 (High) and TASK-79 (Low)
  edit the same files this sweep edits (sweep SKILL.md + template; 84 also moves
  spec-bridge:link into the claim step, touching the same step numbering 87 rewrites).
  Operator scoped this sweep to 86–88 only. Checkpoint at sign-off: confirm 84/79 stay
  parked for the duration of this sweep; if another session claims either mid-sweep,
  STOP and surface. Implementers must not "helpfully" fold 84/79 fixes in.
  → **Confirmed at sign-off (operator, 2026-07-30): TASK-84 and TASK-79 stay parked
  for this sweep's duration; implementer model pinned to `claude-opus-5` as authored.**
- Dropping TASK-88 (tail) — only with operator say-so.
- Tier/model escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-86, 87, 88 all Done on the board via spec-bridge:sync, each via its own merged,
version-bumped PR; `node --test`, `scripts/check-docs.mjs`, and the wiki freshness gate
green on main; `docs/wiki/pdlc-sweep.md` re-verified against the shipped doctrine (not
mechanically re-pinned) and CAPSULES.md current; `specs/035..037` (or as renumbered)
each containing spec+plan+tasks, linked to their tasks; no stale sweep worktrees in
`git worktree list`; this file's log complete (including the tokens/cost column
TASK-88 introduces — record best-effort actuals for THIS sweep retroactively once the
column exists) and status flipped to done.

## Execution log

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-07-30 | TASK-86 | #100 | 637c999 | implementer (opus) ~408k subagent tokens, 46 tool calls | model-ID-per-tier doctrine; v0.41.0 + skill 0.10.0; pdlc-sweep NEEDS-REVIEW re-pin, 11 lockstep siblings RE-PIN-ONLY; task worktrees live at .claude/worktrees/task-N this sweep (harness isolation), not .worktrees/ |
