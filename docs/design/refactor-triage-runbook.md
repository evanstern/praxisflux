# pdlc refactor-triage skill — sweep runbook (2026-07-27)

**You (the session reading this) are the ORCHESTRATOR** for the task below. Run it
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — merging serially, treating merge conflicts as routine. Direction
is decided; do not re-litigate it: the TASK-72 card (commit 010a529, the operator-approved
2026-07-27 carding of the agreed refactor-triage design) IS the synthesis — its
Description carries the agreed four-phase design, the pdlc-placement rationale, and the
explicit out-of-scope list. Plan-of-record is the board; this file carries only ordering,
doctrine, and the log.

**Status:** done · operator sign-off on lanes: 2026-07-27 · completed: 2026-07-27
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. The TASK-72 card — the direction source; its Description is the agreed design
   (2026-07-27): three entry modes, team-review as the evaluation engine, operator
   triage with dispositions, accepted findings → cited board tasks, artifact gate.
2. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time (expect: [[pdlc-plugin]],
   [[pdlc-sweep]], [[skill-patterns]], [[team-review-plugin]], [[handoff-protocol]]).
   `docs/skill-patterns.md` (the gate→work→gate authoring shape AC #1 demands);
   `docs/releasing.md` (bump rules); `docs/task-courses.md` (courses are per-feature —
   this task does not trigger one).
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. `backlog task view TASK-72 --plain` before executing.

## State when this runbook was written (2026-07-27, main @ 010a529, v0.39.0)

- **Done already:** card-sweep follow-ups (TASK-68..71, PRs #93–#96, → 0.39.0), runbook
  `docs/design/sweep-followups-runbook.md` status done.
- **In flight in other sessions (do not duplicate; expect their merges):** none on the
  board. (Untracked `docs/wiki/.obsidian/` is local editor noise — ignore, never commit.)
- **Paused — untouched:** none (no `paused` labels on the board).
- **Queued (this runbook's scope):** TASK-72 only.

## Execution lanes (dependency-ordered; parallelize within a lane)

Single-task sweep → one lane, no parallelism, no conflict analysis between lanes.

**Lane A — start immediately:**
- **TASK-72 (default implementer — doctrine-heavy skill authoring, but a single
  cohesive deliverable bounded by nine explicit ACs and a card-recorded agreed design;
  no novel architecture decisions left open)** — new `pdlc/skills/refactor-triage/`
  skill (SKILL.md, precondition gate → four phases → output gate per
  `docs/skill-patterns.md`): Scope (range / whole-repo / headless+policy) → Evaluate
  (orchestrate `team-review:team-review` when installed, lens carries the range +
  drift framing; own inline pass when absent; range mode adds the intent-drift pass
  against runbook + PR specs + pinned wiki notes) → Triage (tracked record,
  accept/reject/defer + rationale per finding; headless applies the declared policy) →
  Execute (accepted findings → `backlog` CLI tasks citing report + file:line, labeled).
  Plus AC #8's edit to `pdlc/skills/sweep/SKILL.md` (Handing off names refactor-triage)
  and AC #9's release mechanics. team-review itself is UNCHANGED (card is explicit).
  Footprint: `pdlc/` + `test/` + `docs/wiki/` re-pins + lockstep version files.

The working name is `refactor-triage`; the card allows `refactor`/`debt-triage` —
implementer's call, record the choice in the spec, not an operator checkpoint.

Record the model tier + rubric justification on the board task at dispatch
(one-way escalation only; escalations are operator checkpoints).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-07-27: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: fetch + ff-only pull at root before the task; the worktree
  cut from fresh `origin/main`.
- Spec Kit: `.specify/` absent — host precedent (board-clearing → downstream-bugfix →
  sweep-followups runbooks) stands: hand-authored
  `specs/NNN-slug/{spec,plan,tasks}.md` + `spec-bridge:link` BEFORE implementation.
  Next free number at authoring: **033**; claim-before-work governs numbers — check
  `origin/main:specs/` at claim time; renumber on collision.
- `node --test` green in the worktree, and again after every history move.
- `scripts/check-docs.mjs` + wiki freshness gate (hard v2: capsules ≤500 chars, note
  bodies ≤8,000, CAPSULES.md regenerated in the same slice as any `description:` change).
- **Version bump gate:** `pdlc/` is released surface → marketplace lockstep bump
  0.39.0 → **0.40.0** (`scripts/sync-version.mjs` to the next free version at
  merge-readiness — re-check at merge time if siblings land), the new skill's own
  `version:` (start 0.1.0), AND `pdlc/skills/sweep/SKILL.md`'s `version:` bump (AC #8
  edits it; currently 0.8.0). `pdlc/README.md` gains the new skill (structural docs
  check will want the living surface true).
- **Same-PR wiki work.** Expect at minimum:
  - [[pdlc-sweep]] — `pdlc/skills/sweep/SKILL.md` is a pinned source; AC #8's edit
    stales it. NEEDS-REVIEW likely (the note's prose describes Handing off).
  - [[pdlc-plugin]] — `pdlc/.claude-plugin/plugin.json` + `pdlc/README.md` are pinned
    sources; its `description:` says "the second skill, sweep" — a third skill amends
    that prose → CAPSULES.md regenerated in the same slice.
  - A **new note for the new skill** (precedent: sweep got its own [[pdlc-sweep]] when
    it outgrew the plugin note) + INDEX.md entry + CAPSULES regen.
  - If a NEW test file is born (vs extending `test/pdlc.test.mjs`), add its catalog
    bullet to [[test-suite-catalog-plugins]] in the same PR.
- Root `README.md`/`CLAUDE.md` updated if what the repo ships changes (a new pdlc
  skill qualifies — at minimum the pdlc plugin's skill list in README).
- NO per-task course (per-feature policy; not requested). Merge commits only; one TASK
  one PR; task-id-led commit subjects with the Co-Authored-By trailer.

## Concurrency & conflict doctrine

- **Hotspots:** version lockstep files (`.claude-plugin/marketplace.json`, every
  `plugin.json`, edited SKILL versions, `action.yml` npx pin); `docs/wiki/INDEX.md` +
  `CAPSULES.md` (any description change); `pdlc/` itself. Single-lane sweep, so these
  only bite against sibling-session merges — fetch and diff against `origin/main`
  before diagnosing "my branch broke".
- **Paused tasks are not live lanes** — none exist at authoring; if one appears,
  never claim, rebase, or clean its branches/worktrees.
- Reconcile by what the branch carries: this branch WILL carry re-pins (wiki notes
  pinned to its own commits) → **pin-carrying: merge `origin/main` in, never rebase**;
  its PR lands as a merge commit, never a squash. Take main's side for anything not
  deliberately changed.
- **Honest re-pins only — a merge-in never justifies a pin bump.** Route every pin the
  merge stales or conflicts through the wiki-update plan loop: read
  `git diff <old-pin>..<merge-commit> -- <sources>`, classify RE-PIN-ONLY vs
  NEEDS-REVIEW (re-verify prose against the diff BEFORE bumping). The merge commit is
  the re-pin *target* once verified, never the *justification*.
- After every history move: re-run `node --test`, `scripts/check-docs.mjs`, and the
  freshness probe unconditionally.
- **Claim before work:** the FIRST commit claims it — TASK-72 → In Progress AND the
  `specs/033-*` directory stub — before any spec authoring or code; push immediately
  (`git push -u origin <branch>`); never force-push a claim.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  Another session holding the task or number → STOP and surface to the operator.
  Unrelated rejection with task+number still free → merge `origin/main` into the claim
  branch and re-push plain.
- Verify the PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head. `gh` is at `/opt/homebrew/bin/gh`.
- Board/spec commands run from ROOT, never inside a worktree; add specific task files
  to git, never `backlog/` wholesale.

## Operator checkpoints (do not proceed silently)

- None parked in the card — the design was agreed 2026-07-27 and the out-of-scope list
  is explicit. Re-litigating scope (e.g. wanting to change team-review, or splitting
  eval-orchestration from triage-to-board) is a STOP-and-surface, not a judgment call.
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-72 Done on the board via its own merged PR (spec-bridge:sync derived, never
hand-set); `node --test`, `scripts/check-docs.mjs`, and the wiki freshness gate green
on main at v0.40.0; the new skill's wiki note + INDEX/CAPSULES current; sweep's Handing
off names refactor-triage; no stale sweep worktrees in `git worktree list`; this file's
log complete and status flipped to done.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
| 2026-07-27 | TASK-72 | #97 | 3e96cd7 | refactor-triage skill 0.1.0 (4 phases + prose gate); sweep 0.9.0 hands off to it; v0.40.0; new wiki note pdlc-refactor-triage; pdlc-plugin/pdlc-sweep reviewed re-pins; no reconcile needed (main never moved); Done via spec-bridge:sync |
