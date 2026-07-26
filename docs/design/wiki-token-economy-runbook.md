# Wiki token economy — sweep runbook (2026-07-25)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it:
`vault/Grounded-Wiki-Scaling/Analysis-Token-Economy-for-the-Grounding-Wiki.md` wins.
Plan-of-record is the board; this file carries only ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-07-26
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. `vault/Grounded-Wiki-Scaling/Analysis-Token-Economy-for-the-Grounding-Wiki.md` — the
   direction source (verdict + priority order); its branch MOC for the evidence.
2. `docs/corpus-spec.md` — the contract TASK-48 amends; `docs/releasing.md` (bump rules);
   `docs/task-courses.md` (per-task course gate).
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. The task you're about to execute (`backlog task view TASK-<n> --plain`).

## State when this runbook was written (2026-07-25, main @ c9c209b)

- **Done already:** through TASK-47 (claim-before-work doctrine, marketplace 0.13.0).
  The vault branch + analysis exist but are uncommitted (setup commit pending, see
  checkpoints).
- **In flight in other sessions (do not duplicate; expect their merges):** none visible
  on the board; a sibling session merged TASK-47 earlier today — expect main to move.
- **Queued (this runbook's scope):** TASK-48 → (TASK-49 ∥ TASK-51) → TASK-50.

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — tasks below share file footprints,
so concurrent PRs will conflict; the lanes bound how bad it gets.

**Lane 1 — start immediately, alone:**
- **TASK-48 (session-tier — contract prose over an interchange spec; judgment-heavy,
  low code volume)** — corpus-spec v2: consumption protocol, capsule tier, size cap +
  split discipline, section addressability. CONTRACT-shaped: its published spec unblocks
  both Lane-2 tasks; nothing else may start until it merges.

**Lane 2 — after TASK-48 merges, develop in parallel, merge serially:**
- **TASK-49 (default implementer tier — chassis/gate code + node --test coverage)** —
  grounding-wiki generates CAPSULES.md; gate enforces capsule budget + note size cap.
- **TASK-51 (default implementer tier — scoped skill-prose edits across two plugins)** —
  consumer routing: planted PDLC CLAUDE.md block + sweep/reorient orient on the rollup.
- Both bump the lockstep marketplace version → guaranteed collision in
  `.claude-plugin/marketplace.json` + every `plugin.json`. Merge smaller-first; the
  second rebases, re-runs `scripts/sync-version.mjs` to take the next version, re-runs
  gates, then merges.

**Lane 3 — after TASK-49 merges (needs its tooling; biggest wiki footprint, gets a
clean lane):**
- **TASK-50 (default implementer tier — editorial splitting + mechanical conformance,
  driven by TASK-49's tooling)** — apply v2 to docs/wiki: trim capsules, split oversized
  notes (build-and-release.md first), generate CAPSULES.md, gates green.

Record the model tier + rubric justification on each board task at dispatch
(one-way escalation only; escalations are operator checkpoints). The host ships no
formal tier rubric (no constitution found); tiers above are judgment-based and recorded
as such.

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (`scripts/check-merge-drift.mjs` not shipped here). Raw
  git doctrine stands: fetch + ff-only pull at root before each task; fresh
  `origin/main` base for every worktree.
- **Spec Kit peer: `.specify/` absent.** Host precedent (specs/001-reconcile-endpoint,
  TASK-27/30) is hand-authored `specs/NNN-slug/{spec,plan,tasks}.md` dirs. Operator
  decision at sign-off governs (see checkpoints).
- `node --test` — full suite green in the worktree, and again after every rebase.
- `node scripts/check-docs.mjs` + the wiki freshness gate (also run by pre-commit /
  pre-push hooks and the Stop hook) — finish with a `/grounding-wiki:wiki-update` pass
  when freshness fails on the diff.
- **Version bump gate** (`scripts/check-version-bump.mjs`, CI-enforced): any PR touching
  released surface (plugin dirs, `lib/`, `scripts/`, `.claude-plugin/`) bumps the
  marketplace version via `scripts/sync-version.mjs` AND each edited skill's own
  `version:` per `docs/releasing.md`. Applies to TASK-49 (grounding-wiki) and TASK-51
  (pdlc + reorient). TASK-48/50 are docs-only — no bump.
- **Same-PR wiki re-pins** when the diff touches a note's `sources:`—
  TASK-48 → `docs/wiki/grounded-corpus-spec.md`; TASK-49 →
  `docs/wiki/grounding-wiki-plugin.md`; TASK-51 → `docs/wiki/pdlc-plugin.md` +
  `docs/wiki/reorient-plugin.md`; TASK-50 IS the wiki — its freshness pass is the work.
- **Per-task course** at `docs/courses/TASK-<n>/`, passing the course gate, riding the
  same PR (`docs/task-courses.md`; TASK-41 would make this opt-in but is not Done — the
  mandatory rule stands).
- **Merge with merge commits, never squash** (squash orphans wiki `verified_against`
  pins). One TASK, one PR; subtasks are commits. Commit messages lead with the task id
  and end with the `Co-Authored-By: Claude …` trailer.

## Concurrency & conflict doctrine

- **Hotspots:** `.claude-plugin/marketplace.json` + every `plugin.json` (lockstep
  version sync — TASK-49 vs TASK-51 will collide here by design);
  `docs/wiki/*` (TASK-50 reworks the corpus wholesale; 48/49/51 each re-pin single
  notes — hence TASK-50 runs last, alone); `docs/corpus-spec.md` (TASK-48 only);
  `docs/wiki/INDEX.md` (TASK-50's splits add entries).
- Rebase, never merge-commit into a task branch; take main's side for anything you didn't
  deliberately change; re-run gates after every rebase.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a rebase between.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress AND the spec number's directory (a stub claims the number) — before any
  spec authoring or code. Push immediately (`git push -u origin <branch>` on first
  commit, so in-flight work is auditable from any clone); never force-push a claim.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  If another session now holds that task or number, STOP the lane and surface it to
  the operator. Unrelated rejection (e.g. a board-notes push) with the task+number
  still free → rebase and re-push the claim.
- No merge-drift gate here, so claim checks are manual: check `origin/main:specs/` and
  the board before claiming an NNN; next free number at authoring time is `002`.
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head.

## Operator checkpoints (do not proceed silently)

- **Spec Kit gap — RESOLVED at sign-off (2026-07-26):** operator chose host precedent —
  hand-authored `specs/NNN-slug/{spec,plan,tasks}.md` dirs; TASK-43 stays separate.
- **Setup commit — RESOLVED at sign-off (2026-07-26):** operator chose a small setup PR
  (vault + runbook + the four task files) merged to main before Lane 1 starts.
- **Numeric budgets:** TASK-48 fixes the capsule token budget (~100–150) and note cap
  (~2k tokens) — analysis confidence on the numbers is medium. If TASK-49/50 find a
  budget unworkable (capsules unroutable, cap forcing stub splits), stop and resurface
  rather than silently adjusting the spec.
- **TASK-50 split fan-out:** if conformance requires splitting more than ~3 notes or a
  non-additive INDEX restructure, pause for the operator before proceeding.
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-48, TASK-49, TASK-50, TASK-51 all Done on the board, each via its own merged PR
(merge commits, no squash); CI green on main; `node scripts/check-docs.mjs` + wiki
freshness gate green at root; `docs/wiki/CAPSULES.md` exists, is gate-covered, and every
note conforms to corpus-spec v2 budgets; per-task courses in place for all four;
`git worktree list` shows no sweep leftovers; this file's log complete and status
flipped to done.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
