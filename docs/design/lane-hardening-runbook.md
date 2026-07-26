# Lane hardening — sweep runbook (2026-07-26)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: each task's board
description records it (TASK-43's dogfood findings for 53/54; the promptworld pause
observation for 55; TASK-52's follow-on doctrine for 56). Plan-of-record is the board;
this file carries only ordering, doctrine, and the log.

**Status:** signed-off · operator sign-off on lanes: 2026-07-26
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. The task you're about to execute (`backlog task view TASK-<n> --plain`).
2. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time. `docs/releasing.md`
   (bump rules); `docs/task-courses.md` (courses are per-feature — no per-task courses
   despite TASK-55's description echoing the old law; the merged policy governs).
3. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-07-26, main @ b6c56d2)

- **Done already:** wiki-token-economy + board-clearing sweeps (PRs #56–#73); TASK-52
  (reorient session-owned runs, PR #74, marketplace 0.22.0); planted artifacts
  refreshed across praxis/promptworld/coda/hermes-praxis.
- **In flight in other sessions:** none on the board; root on main, clean.
- **Queued (this runbook's scope):** Lane 1 (56 ∥ 55 ∥ 53) → Lane 2 (54, after 53).

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially.

**Lane 1 — start immediately, in parallel (three worktrees):**
- **TASK-56 (default implementer — reorient run.mjs/gate + tests + SKILL.md)** —
  worktree-first begin: deterministic shared-primary-checkout detection (.git dir vs
  gitdir: file), refusal with the worktree recipe, explicit auditable override recorded
  on the manifest. Isolated to reorient/.
- **TASK-55 (default implementer — sweep doctrine + convention docs + HOST leg)** —
  paused-lane marker: (a) praxis side — documented CLI-set `paused` label convention,
  pdlc:sweep SKILL.md excludes paused tasks from lane conflict analysis and lists them
  "paused — untouched" in the runbook header (this template gains that header slot);
  (b) **cross-repo leg (operator sign-off covers it):** promptworld's
  `scripts/check-merge-drift.mjs` downgrades paused tasks' branch/worktree findings to
  info in all three modes — its own PR in promptworld under promptworld's gates, merged
  as part of this task (the task is Done only when both legs are merged).
- **TASK-53 (default implementer — pdlc plant.mjs + tests)** — absent-peer
  deterministic trace (sentinel field + stderr notice; SKILL.md references it).
- Merge order within the lane: smallest-first; each later merger rebases + re-bumps
  (marketplace starts at 0.22.0 → 0.23.0/0.24.0/0.25.0) + re-pins per the usual drill.

**Lane 2 — after TASK-53 merges (same files: plant.mjs, its tests, bootstrap SKILL.md):**
- **TASK-54 (default implementer — pdlc plant.mjs + tests)** — PROJECT_NAME override
  (--name flag or repo-metadata derivation with basename fallback; worktree-case test;
  re-plant from a differently-named checkout not spuriously drifted). Note: this trap
  fired twice live during the planted-artifact refresh — the fix is well-motivated.

## Per-PR gates this project enforces (enumerated)

- Merge-drift gate: absent in praxis (raw git doctrine: fetch + ff-only pull at root
  before each task; fresh origin/main base per worktree). Promptworld's leg of TASK-55
  DOES have merge-drift gates — run them at its choke points (session/worktree/pr).
- Spec Kit: hand-authored `specs/NNN-slug/` dirs + spec-bridge:link. Next free number:
  check `origin/main:specs/` at claim time (claim-before-work; push -u on first commit).
- `node --test` green in the worktree and after every rebase; `scripts/check-docs.mjs`
  + wiki freshness (hard v2: capsules ≤500, bodies ≤8,000, CAPSULES.md regenerated in
  the same slice as any description change).
- Version bump gate: every task here touches released surface (pdlc/, reorient/) →
  edited SKILL.md `version:` bumps + `scripts/sync-version.mjs` to the next free.
- Same-PR wiki re-pins per the freshness gate (expect pdlc-plugin for 53/54/55,
  reorient-plugin for 56, plus lockstep stales).
- NO per-task courses (per-feature policy). Merge commits only; one TASK one PR;
  task-id-led commit subjects with the Co-Authored-By trailer.

## Concurrency & conflict doctrine

- **Hotspots:** `pdlc/scripts/plant.mjs` + `test/pdlc.test.mjs` + bootstrap SKILL.md
  (53 then 54 — the Lane 2 ordering exists for this); `pdlc/skills/sweep/SKILL.md` +
  this template's runbook skeleton (55 only); version lockstep files (all four —
  serial merges + re-bump); `docs/wiki/*` (every re-pinning PR).
- Rebase, never merge-commit into a task branch; take main's side for anything you
  didn't deliberately change; re-run gates after every rebase.
- **Claim before work:** first commit claims (board card → In Progress AND the spec
  number's dir stub), push -u immediately; never force-push a claim (post-rebase
  --force-with-lease on an already-claimed branch is fine). A rejected push means you
  lost the race: fetch, re-read board + specs/; contended → stop the lane, surface.
- Verify a PR merged before deleting its branch/worktree; never delete+recreate a
  closed PR's head.
- **Root discipline (operator-reinforced 2026-07-26): never switch branches in the
  shared primary checkout** — root stays on main; all branch work in `.worktrees/`.

## Operator checkpoints (do not proceed silently)

- **TASK-55 cross-repo leg — RESOLVED at sign-off (2026-07-26):** check-merge-drift.mjs
  legitimately lives host-side (the sweep's consume-when-present contract, TASK-46; its
  probes are host-specific). Both legs ship as part of this task: praxis PR (doctrine +
  convention) and a promptworld PR (gate downgrade), each under its repo's gates.
  Upstreaming the gate's generic core into the praxisflux chassis is a possible future
  task — NOT this one's scope; card only with operator approval.
- **TASK-55 marker mechanism:** default is a `paused` label (Backlog.md labels are
  CLI-set and machine-findable); if implementation finds Backlog custom statuses are
  cleaner, that's a mechanism swap within scope — record it, don't re-ask.
- **TASK-56 override spelling:** `--shared-checkout` flag AND/OR project marker — the
  spec fixes the flag as required; a marker is optional additive. Implementation
  judgment, recorded.
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-53, 54, 55, 56 all Done on the board, each via its own merged PR (merge commits);
TASK-55's promptworld PR also merged; CI green on main; check-docs + wiki freshness
(hard v2, CAPSULES current) + spec-bridge green at root; `git worktree list` clean;
this file's log complete and status flipped to done.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
