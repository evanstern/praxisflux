# {{SWEEP_TITLE}} — sweep runbook ({{DATE}})

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: {{DIRECTION_SOURCES}}
win. Plan-of-record is the board; this file carries only ordering, doctrine, and the log.

**Status:** {{draft | signed-off | executing | done}} · operator sign-off on lanes: {{DATE|pending}}
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. {{DIRECTION_SOURCES — the synthesis/design docs that produced these tasks}}
2. {{PROJECT_GATE_DOCS — e.g. the design-reference INDEX with its gate rules}}
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. The task you're about to execute (`backlog task view TASK-<n> --plain`).

## State when this runbook was written ({{TIMESTAMP}})

- **Done already:** {{...}}
- **In flight in other sessions (do not duplicate; expect their merges):** {{...}}
- **Queued (this runbook's scope):** {{task ids in execution order}}

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — tasks below share file footprints,
so concurrent PRs will conflict; the lanes bound how bad it gets.

**Lane 1 — start immediately, in parallel:**
- **TASK-{{n}} ({{tier}} — {{rubric justification}})** — {{one-line scope; note if only
  its CONTRACT blocks others while implementation can lag}}
- …

**Lane 2 — after {{condition}}:**
- …

**Lane N — tail (droppable):**
- …

Record the model tier + rubric justification on each board task at dispatch
(one-way escalation only; escalations are operator checkpoints).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: {{present at scripts/check-merge-drift.mjs | absent}}.** When
  present, mandatory at every choke point: `session` at sweep start (janitor + drift
  matrix), `worktree [--spec NNN]` before every `git worktree add`, `pr` from the
  worktree before every `gh pr create` AND after every rebase — nonzero exit blocks.
- {{gate 1 — e.g. `node scripts/<check>.mjs --changed` before any PR touching <path>}}
- {{gate 2 — e.g. same-PR amendment of <reference doc>, status flips, pin bumps}}
- {{re-ground obligations — wiki refresh triggers, downstream doc freshness checks}}

## Concurrency & conflict doctrine

- **Hotspots:** {{actual paths concurrent work fights over}}
- Rebase, never merge-commit into a task branch; take main's side for anything you didn't
  deliberately change; re-run gates after every rebase.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a rebase between.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- Spec-number collisions: check `origin/main:specs/` before claiming an NNN.
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head.

## Operator checkpoints (do not proceed silently)

- {{parked design questions, each with the moment it resurfaces}}
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

{{The checkable end state: which tasks Done via merged PRs; which gates green on main;
grounding fresh; no stale worktrees; this file's log complete and status flipped to done.}}

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
