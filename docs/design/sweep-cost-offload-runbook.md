# Sweep-cost offload (read gate + local-model seam) — sweep runbook (2026-09-10)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: the three board cards
(TASK-0124, TASK-0126, TASK-0127) win — they carry the design rationale in full. Plan-of-record
is the board; this file carries only ordering, doctrine, and the log.

**Status:** executing · operator sign-off on lanes: 2026-09-10 (lanes approved as
authored; all three escape lines signed; checkpoints 1–3 answered at sign-off and
recorded as gate lines below)
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->

## Read first (in this order)

1. The three board cards — `backlog task view TASK-0124 / TASK-0126 / TASK-0127 --plain`.
   They are the direction sources; each carries its own design rationale and hazard
   analysis (fail-open schema drift, corpus-rot-via-summarized-read, routing-vs-verifying).
2. `docs/releasing.md` — every one of these PRs touches released surface (pdlc/, lib/,
   grounding-wiki/) and must bump versions.
3. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time — expect `chassis`,
   `grounding-wiki-plugin`, `pdlc-plugin`, `pdlc-grounding-block`, `gates-convention`,
   `test-suite-catalog-plugins-gates-pdlc`.
4. `backlog task list --plain` — live state; other sessions move it while you work.

## State when this runbook was written (2026-09-10)

- **Done already:** TASK-113 (jira provider) and the TASK-108 epic closed; specs through
  062 on `origin/main`; root at d0f1aa7.
- **In flight in other sessions (do not duplicate; expect their merges):** none observed —
  remote branches `task-109-board-mirror`, `task-112-board-verb-table`,
  `task-113-jira-provider`, `task-119-bridge-gate-fanout`, `task-0122-gate-runner-cwd`,
  `board-task-labels`, `hermes-skills`, `pdlc-design-rounds` exist; their specs/tasks are
  on main or Done, so they read as merged leftovers. Do not delete without verifying
  merged (`gh api … --jq .merged`); they are hygiene, not conflicts.
- **Paused — untouched:** none (no task carries the `paused` label).
- **Queued (this runbook's scope):** TASK-0126 → TASK-0124 → TASK-0127
  (0126 and 0124 develop in parallel; 0127 is dependency-gated on 0126's merge).

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — every PR here bumps the lockstep
marketplace version, so concurrent PRs conflict on the version files by construction;
the lanes bound how bad it gets.

**Lane 1 — start immediately, in parallel:**
- **TASK-0126 (sonnet · model `cc/claude-sonnet-5[1m]`, no fallback declared — work to a
  written card whose requirements, fallback semantics, and scope boundary are already
  settled; no unsettled judgment call)** — the structured-offload seam in `lib/`. Spec
  063. **Contract-shaped: its signature + config surface unblock TASK-0127**; internals
  (constrained decoding per backend) can lag the contract. Merges FIRST in this lane
  (smaller expected footprint than 0124's hooks+tests+doctrine).
- **TASK-0124 (sonnet · model `cc/claude-sonnet-5[1m]`, no fallback declared — port of an
  analyzed upstream design with the hazards already carded; execution to a written
  finding)** — the read-size PreToolUse gate in `pdlc/`. Spec 064. Independent of 0126;
  merges SECOND after a reconcile (version-file conflict is guaranteed).

**Lane 2 — after TASK-0126's PR merges:**
- **TASK-0127 (sonnet · model `cc/claude-sonnet-5[1m]`, no fallback declared — consumer
  wiring to the seam 0126 just landed, plus a measurement protocol the card already
  specifies)** — wiki-update triage through the seam, measured. Spec 065. Depends on
  TASK-0126 `Done`. The measurement AC (#5) needs a live local endpoint — see
  checkpoint 2.

No tail lane; nothing here is droppable polish.

Tiers and their model IDs come from **`.claude/model-tiers.json`** — `tiers.mjs --root .
--check` exited 0 before these lanes were authored (2026-09-10, no regeneration, so no
session-restart obligation). All three tasks sit at `defaultTier` (sonnet); the opus tier
is `escalation: true` and untouched — no escalation checkpoints anticipated. Record tier +
model ID + justification on each board task at dispatch, plus which model actually served;
**verify the served model from the first dispatch's transcript before launching siblings.**

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (`scripts/check-merge-drift.mjs` does not exist). The raw
  git commands stand: `git fetch origin && git pull --ff-only` at root before each task;
  collision-check spec numbers against `origin/main` AND remote branch names before
  claiming; confirm branch sits on current `origin/main` before merging.
- `node --test` green in the worktree, **and again after every history move**
  (`.githooks/pre-commit` also runs it, plus the three checks below).
- `node scripts/gen-marketplace.mjs --check` and `node scripts/sync-version.mjs --check`.
- `node scripts/check-docs.mjs` — README.md/CLAUDE.md sync.
- Wiki freshness gate: `node grounding-wiki/gates/cli.mjs freshness . docs/wiki` — these
  PRs touch pinned sources (`lib/`, `pdlc/`, `grounding-wiki/`), so each needs a
  same-PR `/grounding-wiki:wiki-update` pass (honest re-pins: classify per diff,
  RE-PIN-ONLY vs NEEDS-REVIEW; never pin-to-merge-commit as justification).
- **Version bump per `docs/releasing.md`:** marketplace version + each edited plugin's
  version + each edited skill's own `version:`. All three PRs touch released surface.
- PRs land as **merge commits, never squash** (pin-carrying branches; repo standard).
- PR bodies end with the `🤖 Generated with Claude Code` trailer; commits end with the
  `Co-Authored-By` trailer; subjects lead with the task id.

## Per-task artifacts required before PR

Per-TASK obligations. **No PR opens for a task until each line below checks true for
it.** The sweep's Output gate re-checks the first two lines — spec artifacts present AND
the Spec marker still on the card — for every scoped task at the end.

- [ ] `specs/NNN-<slug>/` carries a real `spec.md` (problem + requirements mapped to the
      card's ACs), `plan.md` (constitution absent/unratified here — state that plainly
      and plan against `docs/wiki/`, CLAUDE.md, README), and `tasks.md` (phased
      checkboxes the bridge derives from), committed on the task's branch. A claim stub
      reserves the number; it satisfies nothing here.
- [ ] The card carries its Spec marker from the claim commit (`spec-bridge:link` against
      the stub), and phase ACs are seeded from tasks.md (link update mode) before
      implementation dispatch.
- **Escape lines (operator-signed only):** the host has no `.specify/`; per the recorded
  precedent (bootstrap-tier-rubric and gates-and-doctrine sweeps), the Spec Kit *tooling*
  is excused, the artifacts are not:
  - TASK-0126: hand-authored `specs/063-structured-offload-seam/{spec,plan,tasks}.md` —
    signed operator 2026-09-10.
  - TASK-0124: hand-authored `specs/064-read-size-gate/{spec,plan,tasks}.md` —
    signed operator 2026-09-10.
  - TASK-0127: hand-authored `specs/065-wiki-triage-offload/{spec,plan,tasks}.md` —
    signed operator 2026-09-10.
- **Ruling lines from sign-off (checkable, not prose; signed operator 2026-09-10):**
  - [ ] Checkpoint 1 ruling: the seam config and the 0127 measurement use Ollama at
        `http://localhost:11434` with model `deepseek-r1:latest` (probed answering
        2026-09-10; LM Studio :1234 down). Config home settled in spec 063's plan,
        placed beside `.claude/model-tiers.json` per the card.
  - [ ] Checkpoint 2 ruling: if the endpoint is unreachable when 0127's measurement
        (AC #5) runs, land the code, leave AC #5/#6 unticked, park the task short of
        Done, and surface to the operator — never tick a measurement that didn't run.
  - [ ] Checkpoint 3 ruling: TASK-0124's default line threshold and kill-switch env
        var name are settled in spec 064's plan.md against the card's requirements;
        operator reviews via the PR.

## Concurrency & conflict doctrine

- **Hotspots:** `.claude-plugin/marketplace.json` + every `*/plugin.json` version field
  (lockstep bump — all three PRs collide here by construction); `README.md` /
  `CLAUDE.md` (check-docs sync); `docs/wiki/` pins over `lib/` (0126 and 0127 both touch
  chassis-pinned notes); `grounding-wiki/skills/wiki-update` (0127 only).
- Reconcile by what the branch carries: a **pin-carrying branch** (wiki re-pins ride
  these PRs, so expect all three to be pin-carrying) **merges `origin/main` in** — its
  PR lands as a merge commit, never squash/rebase/force-push; a pin-free branch rebases.
  Take main's side for anything you didn't deliberately change.
- **Honest re-pins only** — after a merge-in, classify every staled pin against
  `git diff <old-pin>..<merge-commit> -- <sources>`: RE-PIN-ONLY vs NEEDS-REVIEW
  (re-verify prose BEFORE bumping). The merge commit is the re-pin *target*, never the
  *justification*.
- After every history move: re-run `node --test`, the check scripts, AND the freshness
  probe unconditionally.
- Lane 1's two PRs both bump versions: 0126 merges first, then 0124 merges `origin/main`
  in (re-bumping its version on top), re-runs gates, then opens/updates its PR. Never
  merge both within one re-ground cycle without that reconcile.
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work:** FIRST commit of each task = board card → In Progress +
  `specs/NNN-*/` stub + `spec-bridge:link` marker, on the task branch cut from
  `origin/main` at `.worktrees/task-<n>`; push immediately (`git push -u origin`);
  never force-push a claim. Rejected push = lost race: fetch, re-read board and specs;
  taken task/number → STOP the lane, surface to operator; unrelated rejection → merge
  `origin/main` in, plain re-push.
- Verify merged (`gh api … --jq .merged`) before deleting any branch/worktree; never
  delete+recreate a closed PR's head.

## Operator checkpoints (do not proceed silently)

1. **Local endpoint + model for the seam config and the 0127 measurement** (which host,
   which backend, which model) — asked at lane sign-off; ruling recorded above.
2. **Measurement execution mode** (in-sweep vs deferred if the endpoint is down) — asked
   at lane sign-off; ruling recorded above.
3. **Read-gate threshold + kill-switch naming home** — settled in spec 064 unless the
   operator overrides at sign-off; ruling line above.
4. Tier escalations (none anticipated); lane amendments (amend this file, note why, tell
   the operator).

## Done means

TASK-0124, TASK-0126, TASK-0127 all `Done` on the board via spec-bridge:sync's derived
plan, each through its own merged (merge-commit) PR; specs 063/064/065 each carry real
spec.md + plan.md + tasks.md; all three cards still carry their Spec markers; `node
--test`, gen-marketplace, sync-version, check-docs, and the wiki freshness gate green on
`main`; versions bumped per releasing.md and the release published; the 0127 measurement
write-up exists with an explicit second-consumer verdict (or the task is honestly parked
short of Done per checkpoint 2's ruling); `git worktree list` shows no sweep worktrees;
this log complete and status flipped to done.

## Execution log

Multi-phase dispatch stays visible in `notes` — one slot, never a second table: while a
task is in flight its row carries the phases dispatched/completed, updated at each
dispatch boundary; the closing note on merge replaces or absorbs it. `tokens/cost`
carries best-effort actuals from the harness/transcript.

| date | task | PR | merge | tokens/cost (best-effort) | notes |
|------|------|----|-------|---------------------------|-------|
| 2026-09-10 | TASK-0126 | — | — | — | claimed; spec 063 committed; phases: 1 dispatched (sonnet) |
| 2026-09-10 | TASK-0124 | — | — | — | claimed; spec 064 committed; phases: dispatch pending served-model verify |
