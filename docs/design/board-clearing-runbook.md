# Board clearing — sweep runbook (2026-07-26)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: each task's board
description records its ratified owner decision (team-review follow-ups of 2026-07-23,
TASK-32's ratified refinements, the Coda upstream requests) — those win. Plan-of-record
is the board; this file carries only ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-07-26
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. The task you're about to execute (`backlog task view TASK-<n> --plain`) — every
   description embeds its own direction source (owner decisions, review findings).
2. `docs/principles.md` (33/34 amend it), `docs/task-courses.md` (41 rewrites it),
   `docs/releasing.md` (bump rules), `docs/corpus-spec.md` v2 (wiki work follows it).
3. `docs/wiki/CAPSULES.md` — whole-corpus orientation per v2; full notes just-in-time.
4. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-07-26, main @ 7f3f9f9)

- **Done already:** wiki-token-economy sweep complete (TASK-48/49/50/51, PRs #56–#61,
  marketplace 0.15.0, docs/wiki on corpus-spec v2 with hard budget enforcement).
- **In flight in other sessions:** none visible on the board.
- **Queued (this runbook's scope):** Lane 1 (41 ∥ 42 ∥ 33) → Lane 2 (34 ∥ 43) →
  Lane 3 (37 → 40) → tail (38, droppable).

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — tasks below share file footprints,
so concurrent PRs will conflict; the lanes bound how bad it gets.

**Lane 1 — start immediately, in parallel (three worktrees):**
- **TASK-41 (default implementer — ratified-decision docs rewrite)** — per-task courses
  become opt-in (docs/task-courses.md rewrite + repo CLAUDE.md mandate line + freshness
  stance). EARLY on purpose: once merged, later tasks in this sweep follow the new
  recorded policy instead of building 2.2MB courses each. Its own PR still builds a
  course (the mandate is in force until its merge).
- **TASK-42 (default implementer — scoped plugin bugfix + tests)** — team-review
  self-review-safe output gate (.handoff residue must not trip the read-only snapshot).
  Isolated to team-review/; released surface, bumps versions.
- **TASK-33 (default implementer — canonical prose amendment)** — P2 refinements
  (reason-to-approve test, EPIC tier) into docs/principles.md; sync the pdlc template's
  stamped principles region (a test asserts it matches).
- Merge smallest-first; each later merger rebases, re-runs sync-version to the next
  free version where it bumps released surface, re-pins, re-runs gates.

**Lane 2 — after ALL of Lane 1 merges (principles and CLAUDE.md settled):**
- **TASK-34 (session-tier — canonical principle P3 + spec-bridge gate design; the
  biggest slice, HIGH, Coda-blocking)** — P3 artifact-gated seams in principles.md
  (after 33's P2 text is in), plus spec-bridge opt-in phase-level status vocabulary
  (derivation + bridge gate, 3-status boards unchanged). Released surface.
- **TASK-43 (default implementer — dogfood run + reconciliation)** — pdlc:bootstrap on
  this repo: plant markers into the existing hand-rolled CLAUDE.md (idempotent-append
  proof), .pdlc sentinel, gitignore .handoff/. After 41 so the planted/reconciled
  CLAUDE.md carries the new course policy, and its template principles region will need
  the 33-refreshed text (34's P3 may land after — whichever merges second re-syncs).
- Develop in parallel (footprints barely overlap: 34 = principles+spec-bridge,
  43 = root CLAUDE.md/.gitignore/sentinel); merge serially, smaller first.

**Lane 3 — after Lane 2 merges (README/CLAUDE story finalized last), serial:**
- **TASK-37 (default implementer — decision execution + doc fixes)** — build/ listing:
  execute the operator's sign-off decision (see checkpoints); reconcile catalog,
  README row, build/README.md to one story. Released surface if build/README.md moves.
- **TASK-40 (default implementer — README/docs honesty reframe)** — LAST of the
  README-touchers by design: reframes enforcement claims (advisory-local vs CI-hard),
  per-plugin enforcement surface table, fixes the seven-vs-eight plugin count — against
  the repo's FINAL post-37/43 state.

**Lane 4 — tail (droppable):**
- **TASK-38 (default implementer — mechanical rename + reference sweep)** — rename
  tracked docs/handoffs/ → docs/design-inputs/; update team-review/README.md (+ wiki
  notes citing the old paths). After 42 (same plugin README). The .handoff/ transport
  name does NOT change.

Record the model tier + rubric justification on each board task at dispatch
(one-way escalation only; escalations are operator checkpoints). The host ships no
formal tier rubric; tiers above are judgment-based and recorded as such.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (`scripts/check-merge-drift.mjs` not shipped). Raw git
  doctrine stands: fetch + ff-only pull at root before each task; fresh `origin/main`
  base for every worktree.
- **Spec Kit peer: `.specify/` absent at authoring time; TASK-43 installs the pdlc
  layer mid-sweep.** Host precedent stands for the WHOLE sweep: hand-authored
  `specs/NNN-slug/{spec,plan,tasks}.md` + spec-bridge:link. Next free number at
  authoring: `006`; claim-before-work governs numbers.
- `node --test` green in the worktree, and again after every rebase.
- `node scripts/check-docs.mjs` + wiki freshness gate (pre-commit/pre-push/Stop-hook
  enforced). The wiki is on corpus-spec v2 with HARD budget enforcement: any note you
  touch keeps its capsule ≤500 chars and body ≤8,000, and any `description:` change
  requires regenerating `docs/wiki/CAPSULES.md` in the same slice
  (`node grounding-wiki/scripts/capsules.mjs <root> docs/wiki`).
- **Version bump gate** (CI-enforced): released surface (plugin dirs, lib/, scripts/,
  `.claude-plugin/`) → marketplace bump via `scripts/sync-version.mjs` + each edited
  skill's `version:`. Applies to 42, 34, likely 37/38/43 (plugin READMEs and templates
  are released surface); 33/40/41 are docs-only unless they touch the pdlc template
  (33 does — bump accordingly).
- **Same-PR wiki re-pins** where the diff touches note `sources:` — notably
  `skill-patterns`/`gates-convention` (33/34 principles), `spec-bridge-plugin` (34),
  `team-review-plugin` (42, 38), `pdlc-plugin` (33/43), `overview`/`build-plugin` (37,
  40). Check the freshness gate's own output rather than trusting this list.
- **Per-task course**: REQUIRED for Lane-1 tasks (mandate in force at their merge).
  From the first post-41 merge onward, follow the policy docs/task-courses.md then
  records — build a course only where that policy demands it, and note the choice in
  the task's implementation notes.
- **Merge with merge commits, never squash.** One TASK, one PR; subtasks are commits.
  Commit subjects lead with the task id; trailer `Co-Authored-By: Claude …`.

## Concurrency & conflict doctrine

- **Hotspots:** `docs/principles.md` + the pdlc template's stamped principles region
  (33 → 34 → 43 ordering exists for this); root `README.md` + `CLAUDE.md` + the
  check-docs sync gate (41, 43, 37, 40 — hence 40 merges last);
  `.claude-plugin/marketplace.json` + every `plugin.json` (all bumpers collide by
  design — serial merges + re-bump); `docs/wiki/*` incl. CAPSULES.md regeneration
  (every re-pinning PR); `team-review/` (42 then 38).
- Rebase, never merge-commit into a task branch; take main's side for anything you
  didn't deliberately change; re-run gates after every rebase.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a rebase between.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress AND the spec number's directory (a stub claims the number) — before any
  spec authoring or code. Push immediately (`git push -u origin <branch>` on first
  commit); never force-push a claim (post-rebase `--force-with-lease` on an already-
  claimed branch is fine).
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  If another session now holds that task or number, STOP the lane and surface it to
  the operator. Unrelated rejection with the task+number still free → rebase, re-push.
- No merge-drift gate here, so claim checks are manual: check `origin/main:specs/` and
  the board before claiming an NNN.
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head.

## Operator checkpoints (do not proceed silently)

- **TASK-37 decision — RESOLVED at sign-off (2026-07-26):** operator chose (a) — keep
  build/ listed as a skill-only plugin (pdlc precedent); fix build/README.md and the
  repo README row to describe what actually ships.
- **TASK-41 spelling — RESOLVED at sign-off (2026-07-26):** operator chose the standing
  per-project choice — each project records once (in its grounding/config) whether it
  wants courses per-task, per-feature, or not at all; no per-cycle prompt.
- **TASK-43 touches the repo's always-on CLAUDE.md** (marker planting into hand-rolled
  text). Bootstrap must append, never clobber; if the plant would rewrite existing
  prose beyond adding its marked block, STOP and surface the diff.
- **TASK-34 backward compatibility** is a hard requirement: any design where a
  3-status board changes behavior → STOP and surface.
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-33, 34, 40, 41, 42, 43 (and 37, 38 unless the operator drops the tail) all Done
on the board, each via its own merged PR (merge commits); CI green on main;
check-docs + wiki freshness (hard v2 enforcement, CAPSULES.md current) green at root;
spec-bridge gate green; courses present exactly where the policy in force at each
merge demanded; `git worktree list` clean; this file's log complete and status
flipped to done.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
