# Card-sweep follow-ups — sweep runbook (2026-07-27)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: the four board cards
(TASK-68..71, commit fd09e4b — the operator-approved 2026-07-27 card sweep) ARE the
synthesis; each carries the incident, origin trail, and ACs from the downstream-bugfix
sweep's parked findings. Plan-of-record is the board; this file carries only ordering,
doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-07-27
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. The four task cards — they are the direction source; each card's Description carries
   its incident and origin (all parked by implementers during the downstream-bugfix
   sweep, `docs/design/downstream-bugfix-runbook.md`, status done; carding approved by
   operator 2026-07-27, commit fd09e4b).
2. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time (expect:
   grounding-wiki-plugin for 68; build-and-release + release-pipeline for 69;
   team-review-plugin + handoff-protocol for 70; test-suite-catalog + test-suite +
   grounded-corpus-spec for 71). `docs/releasing.md` (bump rules); `docs/task-courses.md`
   (courses are per-feature — none of these tasks triggers one).
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. The task you're about to execute (`backlog task view TASK-<n> --plain`).

## State when this runbook was written (2026-07-27, main @ 5f2406b, v0.36.0)

- **Done already:** downstream-bugfix sweep (TASK-58..66, PRs #82–#90, → 0.36.0);
  TASK-67 re-plant grounding (PR #92). Root on main, clean.
- **In flight in other sessions (do not duplicate; expect their merges):** none on the
  board. (Untracked `docs/wiki/.obsidian/` is local editor noise — ignore, never commit.)
- **Paused — untouched:** none.
- **Queued (this runbook's scope):** TASK-68, 69, 70 (lane A, parallel dev, serial
  merges) → TASK-71 (tail, after all lane-A merges).

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — tasks below share the version
lockstep files, so concurrent PRs will conflict there; the lanes bound how bad it gets.

**Lane A — start immediately, in parallel (disjoint code footprints):**
- **TASK-68 (default implementer — bounded validation fix, three crisp ACs)** —
  `grounding-wiki/scripts/repin.mjs` gains commit-existence validation
  (`git cat-file -e <hash>^{commit}` in the corpus repo); regression test rides
  `test/grounding-wiki.freshness.test.mjs` (repin's existing home). Footprint:
  `grounding-wiki/` + that test file.
- **TASK-69 (default implementer — argv-guard pattern already established by TASK-66
  for build.mjs; bounded)** — `scripts/sync-version.mjs` refuses missing/non-semver
  argv (usage, exit nonzero, zero files touched); decide-and-record the minimal stance
  on ≤-current versions (check-version-bump already gates increases at PR time).
  Footprint: `scripts/` + a test (new file or an existing suite — implementer's call;
  if a NEW test file is created, add its catalog bullet in the same PR).
- **TASK-70 (default implementer — policy recording + at most a small routing change;
  the POLICY ITSELF is decided at sign-off, see Operator checkpoints)** — team-review
  self-review durable-residue rule recorded in SKILL.md + `docs/wiki/team-review-plugin.md`,
  behavior made to match; TASK-61's tests stay green. Footprint: `team-review/` +
  `docs/wiki/team-review-plugin.md` + `test/team-review.test.mjs`.

**Lane B — tail, only after every lane-A PR has MERGED:**
- **TASK-71 (default implementer — wiki-only catalog closure, mechanical but
  enumeration-sensitive)** — close `docs/wiki/test-suite-catalog.md`'s coverage gap by
  enumerating the ACTUAL `test/*.test.mjs` set at execution time (lane A may add
  files — that is WHY this is the tail); per-file bullets + sources for every file,
  8000-char body budget (split summary-style if needed), CAPSULES regenerated on any
  `description:` change. Wiki-only → no version bump. Droppable without breaking
  anything, but it is the sweep's re-grounding capstone — drop only with operator say-so.

Merge order within lane A: smallest-ready-first (expected: 69 → 68 → 70, but readiness
wins over prediction). Re-bump the lockstep version at each merge
(0.36.0 → 0.37.0 → 0.38.0 → 0.39.0 if nothing else lands).

Record the model tier + rubric justification on each board task at dispatch
(one-way escalation only; escalations are operator checkpoints).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-07-27: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: fetch + ff-only pull at root before each task; every
  worktree cut from fresh `origin/main`.
- Spec Kit: `.specify/` absent — host precedent (board-clearing → downstream-bugfix
  runbooks) stands for the whole sweep: hand-authored
  `specs/NNN-slug/{spec,plan,tasks}.md` + `spec-bridge:link` BEFORE implementation.
  Next free number at authoring: **029**; claim-before-work governs numbers — check
  `origin/main:specs/` at claim time; renumber on collision.
- `node --test` green in the worktree, and again after every history move.
- `scripts/check-docs.mjs` + wiki freshness gate (hard v2: capsules ≤500 chars, note
  bodies ≤8,000, CAPSULES.md regenerated in the same slice as any `description:` change).
- Version bump gate: TASK-68 (`grounding-wiki/`), 69 (`scripts/`), 70 (`team-review/`)
  touch released surface → marketplace bump + every edited SKILL.md's own `version:`
  bump + `scripts/sync-version.mjs` to the next free version at merge-readiness.
  TASK-71 is wiki-only → no bump (check-version-bump will not demand one; do not bump).
- Same-PR wiki re-pins per the freshness gate. Expect at minimum: 68 →
  `grounding-wiki-plugin`, `test-suite-catalog` (its test file is a catalog source);
  69 → `build-and-release` and/or `release-pipeline` (sync-version is pinned there),
  plus a catalog bullet if a new test file is born; 70 → `team-review-plugin`;
  71 IS the re-pin; plus lockstep stales as they surface.
- NO per-task courses (per-feature policy). Merge commits only; one TASK one PR;
  task-id-led commit subjects with the Co-Authored-By trailer.

## Concurrency & conflict doctrine

- **Hotspots:** version lockstep files (`.claude-plugin/marketplace.json`, every
  `plugin.json`, edited SKILL versions, `action.yml` npx pin — all three lane-A PRs;
  serial merges + re-bump at each); `docs/wiki/test-suite-catalog.md` (68 stales it,
  69 may add to it, 71 rewrites it — lane B's tail position exists for this);
  `docs/wiki/INDEX.md` + `CAPSULES.md` (any description change).
- Pin-aware reconciliation (TASK-57/58 doctrine): pin-carrying task branches MERGE
  `origin/main` in — never rebase; pin-free branches rebase. Post-merge-in staleness
  goes through the wiki-update plan loop (RE-PIN-ONLY vs NEEDS-REVIEW against the
  main-side diff) — never bump a pin without reading the covered diff.
- Take main's side for anything you didn't deliberately change; re-run gates after
  every history move.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a
  reconciliation between; conflicting with a sibling session's open PR → the smaller
  PR merges first.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress AND the spec number's directory (a stub claims the number) — before any
  spec authoring or code. Push immediately (`git push -u origin <branch>` on first
  commit); never force-push a claim.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  If another session now holds that task or number, STOP the lane and surface it to
  the operator. Unrelated rejection with the task+number still free → reconcile and
  re-push the claim (merge-based remedy on pin-carrying branches; no force-push).
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head.
- Board/spec commands run from ROOT, never inside a worktree; add specific task files
  to git, never `backlog/` wholesale.

## Operator checkpoints (do not proceed silently)

- **TASK-70's policy question — settled AT SIGN-OFF, not mid-lane:** is a self-review
  report evidence (must live tracked) or a transient deliverable (gitignored transport
  is fine)? Author's principle-derived recommendation: **(b)-lite** — the handoff
  principle ("transport is gitignored; EVIDENCE lives in tracked state") reads the
  report as the review's durable deliverable, so self-review defaults should land it
  in a tracked location (or copy-on-finish) without reintroducing the TASK-61 gate
  deadlock. Operator may instead bless (a) current-behavior-as-recorded-rule; the
  sign-off answer is recorded on the card and binds the implementer. → **Operator
  chose (b) at sign-off (2026-07-27): self-review report defaults route to a TRACKED
  location (or copy-on-finish) — evidence lives in tracked state — without
  reintroducing the TASK-61 gate deadlock.**
- Dropping TASK-71 (tail) — droppable by construction, but only with operator say-so.
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-68, 69, 70, 71 all Done on the board, each via its own merged PR (three
version-bumped, 71 wiki-only); `node --test`, `scripts/check-docs.mjs`, and the wiki
freshness gate green on main; `docs/wiki/test-suite-catalog.md` covering the FULL
execution-time test-file set with sources; no stale sweep worktrees in
`git worktree list`; this file's log complete and status flipped to done.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
