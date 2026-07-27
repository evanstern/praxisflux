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
- **Paused — untouched (`paused` label in the task's frontmatter `labels:`; excluded
  from lane conflict analysis; never claim, rebase, or clean their
  branches/worktrees):** {{task ids + pause provenance from their append-notes, or "none"}}
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
  worktree before every `gh pr create` AND after every history move (merge-in or
  rebase) — nonzero exit blocks.
- {{gate 1 — e.g. `node scripts/<check>.mjs --changed` before any PR touching <path>}}
- {{gate 2 — e.g. same-PR amendment of <reference doc>, status flips, pin bumps}}
- {{re-ground obligations — wiki refresh triggers, downstream doc freshness checks}}

## Concurrency & conflict doctrine

- **Hotspots:** {{actual paths concurrent work fights over}}
- **Paused tasks are not live lanes:** a task labeled `paused` (set/cleared only via
  `backlog task edit --labels`, provenance in its append-notes) is listed in the state
  snapshot above and NEVER claimed, rebased, or cleaned — its branches and worktrees
  belong to the pausing operator.
- Reconcile by what the branch carries: a **pin-carrying branch** (its own commits are
  referenced by re-pins it carries — wiki notes, design-reference pins) **merges
  `origin/main` in** — squash, rebase, and force-push all rewrite the branch's hashes
  and stale every carried pin, so its PR also lands as a merge commit, never a squash;
  a **pin-free branch rebases**. Take main's side for anything you didn't deliberately
  change.
- **Honest re-pins only — a merge-in never justifies a pin bump** (pin = merge commit
  empties the freshness probe's `git log <pin>..HEAD -- <sources>` range by
  construction). Route every pin the merge staled or conflicted through the
  wiki-update plan loop: read the main-side diff over the note's sources
  (`git diff <old-pin>..<merge-commit> -- <sources>`), classify **RE-PIN-ONLY**
  (provably prose-safe) vs **NEEDS-REVIEW** (re-verify and amend the note's prose
  against that diff BEFORE bumping). Never bump a pin without reading the diff it
  covers; the merge commit is the re-pin *target* once the note is verified, never
  the *justification*.
- After every history move (merge-in or rebase): re-run gates AND the freshness probe
  unconditionally — never gated on whether `docs/wiki/` changed; pins also reference
  design-reference files outside the wiki, so a wiki-untouched diff can still be stale.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a reconcile
  between (merge-in or rebase per the pin rule).
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress AND the spec number's directory (a stub claims the number) — before any
  spec authoring or code. The claim rides the task branch, cut from `origin/main`
  (which does not contain the spec yet — the spec is authored on that branch, after
  the claim). Push immediately (`git push -u origin <branch>` on first
  commit, so in-flight work is auditable from any clone); never force-push a claim.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  If another session now holds that task or number, STOP the lane and surface it to
  the operator. Unrelated rejection (e.g. a board-notes push) with the task+number
  still free → rebase and re-push the claim.
- Where the host ships merge-drift gates (`scripts/check-merge-drift.mjs`), the claim
  checks are mechanical: `claim --dir NNN-slug` before creating any new `specs/NNN-*`
  dir (blocks on a taken number); `worktree --spec NNN --task TASK-<n>` when cutting
  the worktree (warns if the card isn't claimed; accepts a spec dir already claimed by
  that same task).
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
