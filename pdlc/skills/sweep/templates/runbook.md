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
- **TASK-{{n}} ({{tier}} · model {{model-id}}, fallback {{fallback-model-id}} —
  {{rubric justification}})** — {{one-line scope; note if only its CONTRACT blocks
  others while implementation can lag}}
- …

**Lane 2 — after {{condition}}:**
- …

**Lane N — tail (droppable):**
- …

Record the model tier + explicit model ID (plus the fallback ID for
subscription-unavailability, and which model actually served) + rubric justification on
each board task at dispatch (one-way escalation only; escalations are operator
checkpoints).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: {{present at scripts/check-merge-drift.mjs | absent}}.** When
  present, mandatory at every choke point — four modes, probed at the sweep's
  precondition gate, invocations verbatim: `session` at sweep start (janitor + drift
  matrix), `claim --dir <NNN>-<slug>` before creating any new `specs/NNN-*` dir,
  `worktree [--spec <NNN>] [--task TASK-<n>]` before every `git worktree add`, `pr`
  from the worktree before every `gh pr create` AND after every history move
  (merge-in or rebase) — nonzero exit blocks.
- {{gate 1 — e.g. `node scripts/<check>.mjs --changed` before any PR touching <path>}}
- {{gate 2 — e.g. same-PR amendment of <reference doc>, status flips, pin bumps}}
- {{re-ground obligations — wiki refresh triggers, downstream doc freshness checks}}

## Per-task artifacts required before PR

Per-TASK obligations — the per-PR gates above are project machinery; this section is
what every scoped task must have produced. **No PR opens for a task until each line
below checks true for it.** The sweep's Output gate re-checks the first two lines —
spec artifacts present AND the Spec marker still on the card — for every scoped task
at the end.

- [ ] `specs/{{NNN}}-{{slug}}/` carries a real `spec.md` (problem + requirements mapped
      to the card's ACs), `plan.md` (constitution-checked — or stating plainly that the
      constitution is absent/unratified and planning against the grounding docs), and
      `tasks.md` (phased checkboxes the bridge derives from), committed on the task's
      branch — **or** an operator-signed escape line below names the task and what
      stands in for the artifacts. A claim stub reserves the number; it satisfies
      nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link`
      against the stub), and phase ACs are seeded from tasks.md (link update mode)
      before implementation dispatch.
- **Escape lines (operator-signed only):** {{one line per excused task, naming the task
  and the stand-in — e.g. "TASK-<n>: hand-authored spec set per host precedent —
  signed <operator> <date>" — or "none"}}. Whatever sanctions a substitute enters the
  sweep as such a line, **never as a second mechanism** — there is no path to a skipped
  spec set except an operator-signed escape line here.
- {{HOST_ADDITIONS — host-specific per-task artifact obligations, or "none"}}

<!-- Lane-0/precondition rulings that change the per-task loop are written HERE as
     checkable lines, never only as prose in the state snapshot — narrative is not
     read back by any later step; gate lines are. -->

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
  still free → fetch, merge `origin/main` into the claim branch, and re-push — a
  plain push: the merge-based remedy stays executable under a repo-wide rebase ban
  and never needs the force-push a claim forbids (rebasing an already-pushed claim
  would).
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

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while
a task is in flight its row carries the phases dispatched/completed (e.g.
`phases: 1-2 done, 3 dispatched`), updated at each dispatch boundary, so a resuming
session can see where within the task the last one stopped; the closing note on merge
replaces or absorbs it. `tokens/cost` carries best-effort actuals from the
harness/transcript, so future runbook authoring budgets against real numbers.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
