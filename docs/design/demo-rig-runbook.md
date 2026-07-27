# PDLC demo rig — sweep runbook (2026-07-27)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — merging serially, treating merge conflicts as routine. Direction
is decided; do not re-litigate it: the TASK-73 card (commit 755dc70, the operator-ratified
2026-07-27 carding of the demo-rig design) IS the synthesis — its Description carries the
agreed architecture (generator → tagged-stage git history → live-thread + canned fallback →
sandbox remote → self-gating CI + wiki pin) and its eight ACs bound the deliverable.
Plan-of-record is the board; this file carries only ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-07-27
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. The TASK-73 card — the direction source; its Description is the operator-ratified
   design (2026-07-27): stage-0 bare → stage-1 grounded → stage-2 planned → stage-3
   swept → stage-4 triaged, one git tag per stage, every artifact a real capture from
   genuine plugin runs, one live task pre-specced at stage-2 with its merged twin
   canned at stage-3, reset = regenerate with identical IDs and narrative.
2. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time (expect: [[pdlc-plugin]],
   [[pdlc-sweep]], [[pdlc-refactor-triage]], [[grounding-wiki-plugin]],
   [[spec-bridge-plugin]], [[research-plugin]] — the demoed skills; [[release-pipeline]]
   for the bump gate; [[test-suite-catalog]] / [[test-suite-catalog-plugins]] for where
   the CI test's catalog bullet lands). `docs/skill-patterns.md` if the rig ships any
   skill-shaped surface; `docs/releasing.md` (bump rules); `docs/task-courses.md`
   (courses are per-feature — not requested here).
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. `backlog task view TASK-73 --plain` before executing.

## State when this runbook was written (2026-07-27, main @ a13a671, v0.40.0)

- **Done already:** TASK-72 refactor-triage skill (PR #97 → v0.40.0, runbook
  `docs/design/refactor-triage-runbook.md` status done); its triage run carded
  TASK-74..79.
- **In flight in other sessions (do not duplicate; expect their merges):** none on the
  board. (Untracked `docs/wiki/.obsidian/` is local editor noise — ignore, never commit.)
- **Paused — untouched (`paused` label in the task's frontmatter `labels:`; excluded
  from lane conflict analysis; never claim, rebase, or clean their
  branches/worktrees):** none (no `paused` labels on the board).
- **Queued (this runbook's scope):** TASK-73 only. TASK-74..79 (triage debt) are To Do
  but OUT of this sweep's scope — a later sweep's input.

## Execution lanes (dependency-ordered; parallelize within a lane)

Single-task sweep → one lane, no parallelism, no cross-lane conflict analysis.

**Lane A — start immediately:**
- **TASK-73 (default implementer — the design is operator-ratified with eight explicit
  ACs and no open architecture decisions; but note this is the largest single-task
  footprint this repo has swept: the fixture capture requires DRIVING real plugin runs
  (wiki-build, spec authoring, a mini-sweep, a refactor-triage) inside the generated
  demo project, not just writing code. If the implementer stalls on that agentic leg,
  escalation is an operator checkpoint, not a silent retry)** — the demo rig:
  - Generator/reset command materializing the throwaway demo project (tiny Node
    tamagotchi CLI, continuity with TASK-25) from tracked fixtures as a real git repo,
    one tag per stage (stage-0..stage-4), jump-to-stage in seconds (AC #1, #8 —
    repeatability: two consecutive resets yield identical task IDs, tags, narrative).
  - Fixtures captured once from genuine plugin runs; each stage passes its own gates
    when checked out (AC #2).
  - Scratch GitHub sandbox remote wiring — reset force-pushes stage state; live sweep
    opens a genuine PR there (AC #3; see operator checkpoints — repo name/owner is
    confirmed BEFORE creation).
  - Live-thread support: one tiny pre-specced one-file task unmerged at stage-2, its
    merged twin canned at stage-3 as fallback (AC #4).
  - 30-minute runsheet doc (AC #5).
  - CI test regenerating the demo and asserting stage tags + per-stage gates (AC #6).
  - `docs/wiki/` note pinning the rig (generator, fixtures, runsheet) with the demoed
    skill files as sources (AC #7).
  - **Placement is a spec decision, recorded in the spec:** the rig's home (a new
    top-level `demo/` dir vs `scripts/`) decides the version-bump gate (below).
    Footprint: rig home + `test/` + `.github/workflows/` + `docs/wiki/` +
    `README.md`/`CLAUDE.md` + (if bump) lockstep version files.

Record the model tier + rubric justification on the board task at dispatch
(one-way escalation only; escalations are operator checkpoints).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-07-27: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: fetch + ff-only pull at root before the task; the worktree
  cut from fresh `origin/main`.
- **Spec Kit: `.specify/` absent** — host precedent (board-clearing →
  downstream-bugfix → sweep-followups → refactor-triage runbooks; TASK-79 cards the
  doctrine gap) stands: hand-authored `specs/NNN-slug/{spec,plan,tasks}.md` +
  `spec-bridge:link` BEFORE implementation. Next free number at authoring: **034**;
  claim-before-work governs numbers — check `origin/main:specs/` at claim time;
  renumber on collision.
- `node --test` green in the worktree, and again after every history move.
- `scripts/check-docs.mjs` + wiki freshness gate (hard v2: capsules ≤500 chars, note
  bodies ≤8,000 chars, CAPSULES.md regenerated in the same slice as any
  `description:` change).
- **Version bump gate — CONDITIONAL on placement:** released surface is any registered
  plugin dir, `lib/`, `scripts/`, `.claude-plugin/`. If the generator or any rig file
  lands in `scripts/` (or a plugin dir), lockstep bump 0.40.0 → next free version via
  `scripts/sync-version.mjs` at merge-readiness (re-check at merge time if siblings
  land). If the rig lives entirely in a new top-level dir + `test/` + `.github/` +
  docs, no bump is required — but run `node scripts/check-version-bump.mjs` in the
  worktree either way and believe its verdict, not this prediction.
- **Same-PR wiki work.** Expect at minimum:
  - The **new rig note** (AC #7) — sources: the generator, fixtures, runsheet, AND the
    demoed skill files (pdlc sweep/refactor-triage, grounding-wiki, spec-bridge,
    research SKILL.mds) so the freshness gate flags the demo when those skills change.
    Plus INDEX.md entry + CAPSULES.md regen in the same slice.
  - If a NEW test file is born (vs extending an existing suite), its catalog bullet
    in [[test-suite-catalog]] (repo-tooling half) in the same PR — mind TASK-78's
    note that the catalogs are near budget; extend, don't bloat.
  - Any note whose pinned sources the PR touches: classify against the diff
    (RE-PIN-ONLY vs NEEDS-REVIEW) before bumping — never mechanical.
- Root `README.md`/`CLAUDE.md` updated — a demo rig the repo ships qualifies (at
  minimum a README mention of the rig + how to reset/run the demo).
- **CI stays green without secrets:** AC #6's CI test must regenerate and assert
  locally (tags exist, per-stage gates pass) with NO remote access; the sandbox
  force-push (AC #3) is presenter tooling, never a CI step. A spec that finds it
  needs a repo secret hits an operator checkpoint.
- NO per-task course (per-feature policy; not requested). Merge commits only; one TASK
  one PR; subtasks are commits; task-id-led commit subjects with the Co-Authored-By
  trailer.

## Concurrency & conflict doctrine

- **Hotspots:** version lockstep files (`.claude-plugin/marketplace.json`, every
  `plugin.json`, `action.yml` npx pin — only if the bump triggers); `docs/wiki/INDEX.md`
  + `CAPSULES.md` (any description change); root `README.md`. Single-lane sweep, so
  these only bite against sibling-session merges — fetch and diff against
  `origin/main` before diagnosing "my branch broke".
- **Paused tasks are not live lanes:** a task labeled `paused` (set/cleared only via
  `backlog task edit --labels`, provenance in its append-notes) is listed in the state
  snapshot above and NEVER claimed, rebased, or cleaned — none exist at authoring.
- Reconcile by what the branch carries: this branch WILL carry re-pins (the new rig
  note pins the branch's own commits) → **pin-carrying: merge `origin/main` in, never
  rebase**; its PR lands as a merge commit, never a squash. Take main's side for
  anything not deliberately changed.
- **Honest re-pins only — a merge-in never justifies a pin bump.** Route every pin the
  merge stales or conflicts through the wiki-update plan loop: read
  `git diff <old-pin>..<merge-commit> -- <sources>`, classify RE-PIN-ONLY vs
  NEEDS-REVIEW (re-verify prose against the diff BEFORE bumping). The merge commit is
  the re-pin *target* once verified, never the *justification*.
- After every history move: re-run `node --test`, `scripts/check-docs.mjs`, and the
  freshness probe unconditionally.
- **Claim before work:** the FIRST commit claims it — TASK-73 → In Progress AND the
  `specs/034-*` directory stub — before any spec authoring or code; push immediately
  (`git push -u origin <branch>`); never force-push a claim.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  Another session holding the task or number → STOP and surface to the operator.
  Unrelated rejection with task+number still free → merge `origin/main` into the claim
  branch and re-push plain.
- Verify the PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head. `gh` is at `/opt/homebrew/bin/gh`.
- Board/spec commands run from ROOT, never inside a worktree; add specific task files
  to git, never `backlog/` wholesale.
- **Demo-project inner git is not this repo's git:** the generator creates and
  force-pushes a THROWAWAY repo. No rig command may ever run against the praxisflux
  checkout's git — the spec must isolate cwd/GIT_DIR explicitly, and the CI test
  asserts against the generated repo's tags, never this repo's.

## Operator checkpoints (do not proceed silently)

- **Sandbox remote creation (AC #3):** creating a scratch GitHub repo is an
  outward-facing act. Before wiring it, confirm with the operator the owner/name
  (e.g. `evanstern/praxisflux-demo-sandbox`) or take an existing repo they designate.
  Resurfaces: when implementation reaches AC #3.
- **CI secrets:** if the spec concludes AC #6 cannot pass without a repo secret or
  remote access, STOP and surface — the ratified design keeps CI local.
- Re-litigating scope (e.g. wanting a persistent demo project instead of throwaway,
  or folding TASK-74..79 debt in) is a STOP-and-surface, not a judgment call.
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-73 Done on the board via its own merged PR (spec-bridge:sync derived, never
hand-set); all eight ACs ticked with AC #8's repeatability proven (two consecutive
resets, identical stage state); `node --test`, `scripts/check-docs.mjs`, and the wiki
freshness gate green on main; the rig's wiki note + INDEX/CAPSULES current; version
bump present if any released surface was touched (check-version-bump green either way);
no stale sweep worktrees in `git worktree list`; this file's log complete and status
flipped to done.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
