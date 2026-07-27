# Downstream bug-find remediation — sweep runbook (2026-07-26)

**You (the session reading this) are the ORCHESTRATOR** for the tasks below. Run each
through the host project's full PDLC — spec → link → worktree → delegated implementation →
PR → merge → re-ground — parallelizing within lanes, merging serially, treating merge
conflicts as routine. Direction is decided; do not re-litigate it: the nine board cards
(TASK-58..66, commit 6c053c2) ARE the synthesis — each carries the finding, the live-repro
evidence, and the ACs from the promptworld downstream bug-find sweep (2026-07-27, run
against praxis decaa14/v0.27.0). Plan-of-record is the board; this file carries only
ordering, doctrine, and the log.

**Status:** executing · operator sign-off on lanes: 2026-07-26
<!-- Only the OPERATOR flips draft → signed-off (the author never pre-fills it). An
     executing session must refuse a runbook whose status it cannot verify. -->


## Read first (in this order)

1. The nine task cards — they are the direction source; there is no separate synthesis
   doc. Origin trail is in each card's Implementation Notes (promptworld sibling gap is
   their TASK-162; no cross-repo PR belongs to THIS sweep — contrast TASK-55).
2. `docs/wiki/CAPSULES.md` for orientation; notes just-in-time (expect: pdlc-sweep,
   grounding-wiki-plugin, gate-runner, gates-consumption-surface, team-review-plugin,
   educate-plugin, build-plugin, handoff-protocol, reorient-plugin, release-pipeline).
   `docs/releasing.md` (bump rules); `docs/task-courses.md` (courses are per-feature —
   none of these tasks triggers one).
3. `backlog task list --plain` — live state; other sessions move it while you work.
4. The task you're about to execute (`backlog task view TASK-<n> --plain`).

## State when this runbook was written (2026-07-26, main @ 6c053c2, v0.27.0)

- **Done already:** lane-hardening sweep (PRs #75–#79, → 0.26.0); TASK-57
  merge-over-rebase doctrine (PR #81, → 0.27.0); the nine findings carded (6c053c2).
- **In flight in other sessions (do not duplicate; expect their merges):** none on the
  board; root on main, clean. (Untracked `docs/wiki/.obsidian/` is local editor noise —
  ignore, never commit.)
- **Paused — untouched:** none.
- **Queued (this runbook's scope):** TASK-58, 59, 61, 62, 64, 65 (wave 1, parallel) →
  TASK-60 (after 58), TASK-63 (after 62) → TASK-66 (tail).

## Execution lanes (dependency-ordered; parallelize within a lane)

Rule of thumb: DEVELOP in parallel, MERGE serially — tasks below share file footprints,
so concurrent PRs will conflict; the lanes bound how bad it gets.

**Lane A — sweep doctrine (serial: 58 → 60; same files:
`pdlc/skills/sweep/SKILL.md`, `pdlc/skills/sweep/templates/runbook.md`,
`docs/wiki/pdlc-sweep.md`):**
- **TASK-58, HIGH (default implementer — prose/doctrine amendment, well-scoped by three
  ACs)** — dishonest merge-commit re-pin: route post-merge-in staleness through the
  wiki-update plan loop (RE-PIN-ONLY vs NEEDS-REVIEW against the main-side diff); no
  text anywhere instructs bumping a pin without reading the covered diff; state the safe
  procedure for downstream hosts too. **Its doctrine is the sweep's own CONTRACT — land
  it first in the lane** so the rest of this sweep executes under honest re-pin rules.
- **TASK-60, MEDIUM (default implementer — five reconciliations, each a bounded text
  fix)** — claim-step ordering into the SKILL Phase 2 loop; merge-based rejected-claim
  remedy (no force-push, works under a rebase ban); 4-mode drift-gate inventory in both
  files; ticks-before-sync + Done ownership per spec-bridge doctrine; planted CLAUDE.md
  enforcement claims match shipped hooks (also touches `pdlc/templates/CLAUDE.md`).

**Lane B — TASK-59, HIGH (default implementer — gate code + regression tests, precise
repros in hand)** — grounding-wiki gate holes: missing-source paths block loudly
(`grounding-wiki/gates/freshness.mjs`), inline-array `sources:` parsed like block lists,
CAPSULES regenerate-and-compare corpusDir-spelling-invariant
(`grounding-wiki/gates/capsules.mjs`); tests for all three. Isolated to grounding-wiki/
(+ its tests). No overlap with Lane A: 58/60 edit pdlc prose, 59 edits gate code.

**Lane C — TASK-61, MEDIUM (default implementer — scoped script/gate fix with a live
repro)** — team-review self-review deadlock: default report path resolves outside the
target on `begin .`; SKILL claim matches behavior; run-id-keyed filenames (steal
reorient's fix, `reorient/scripts/run.mjs:163-165`); self-review round-trip test.
Isolated to team-review/.

**Lane D — educate (serial: 62 → 63; same files: `educate/gates/dod.mjs`,
`educate/templates/CLAUDE.md`):**
- **TASK-62, MEDIUM (default implementer — three bounded fixes with live repros)** —
  vault-less topic `--check` converges with `--sync`; empty-array DoD truthiness
  consistent with isDelegated; planted commands runnable as written; start skill
  instructs placeholder substitution.
- **TASK-63, MEDIUM (default implementer — seam ownership + doctrine consistency;
  judgment is bounded by AC#1's "exactly one side")** — handoff.returned owner named and
  instructed in that side's skill; `.handoff/`-only artifact doctrine consistent across
  lesson SKILL / planted template / dod.mjs derivation; handoff-protocol refs resolve
  from an installed plugin; delegated-build round-trip test. Also touches
  `build/skills/implement/SKILL.md` and the handoff wiki notes.

**Lane E — TASK-64, MEDIUM (default implementer — cwd-vs-target resolution fix with a
live repro)** — reorient run registry keyed to the resolved target root; Stop gate and
finish see the run; worktree-first refusal evaluates the target checkout; cross-directory
begin/finish test. Isolated to reorient/.

**Lane F — TASK-65, MEDIUM (default implementer — enforcement-contract fixes; the
consumer exit-code contract bounds the risk)** — run-gates exceptions exit 1 not 2
(`scripts/run-gates.mjs`, `docs/consuming-gates.md` stays accurate); stop-docs realpath
+ separator-boundary root match (`scripts/stop-docs.mjs`); gate-runner resolveRoots
crash surfaces as a problem (`lib/gate-runner.mjs`). Chassis-level but file-disjoint
from every other lane.

**Lane G — tail (droppable): TASK-66, LOW (default implementer — grouped mechanical
hygiene)** — hook-command quoting across five plugins' `hooks/hooks.json` + the
scaffold; `build --plugin` scoped dist rebuild + argv usage error; scaffold keeps
check-docs count-claims green + fixture README carries a count claim; non-semver base
skill versions fail loudly in check-version-bump. Sprays version bumps across five
plugins — run it LAST so it rides on a quiet main.

Wave 1 opens six worktrees (58, 59, 61, 62, 64, 65); 60 and 63 cut only after their
lane predecessor MERGES (shared files — never develop the pair concurrently). Merge
serially, smallest-ready-first, re-bumping the marketplace version at each merge
(0.27.0 → 0.28.0 … → 0.36.0 by sweep end if nothing else lands).

Record the model tier + rubric justification on each board task at dispatch
(one-way escalation only; escalations are operator checkpoints).

## Per-PR gates this project enforces (enumerated — implementers cannot miss these)

- **Merge-drift gate: absent** (probed 2026-07-26: no `scripts/check-merge-drift.mjs`).
  Raw git doctrine stands: fetch + ff-only pull at root before each task; every
  worktree cut from fresh `origin/main`.
- Spec Kit: `.specify/` absent — host precedent (board-clearing runbook) stands for the
  whole sweep: hand-authored `specs/NNN-slug/{spec,plan,tasks}.md` + `spec-bridge:link`
  BEFORE implementation. Next free number at authoring: **019**; claim-before-work
  governs numbers — check `origin/main:specs/` at claim time; renumber on collision.
- `node --test` green in the worktree, and again after every history move.
- `scripts/check-docs.mjs` + wiki freshness gate (hard v2: capsules ≤500 chars, note
  bodies ≤8,000, CAPSULES.md regenerated in the same slice as any `description:`
  change).
- Version bump gate: **every task here touches released surface** (plugin dirs, `lib/`,
  `scripts/`) → marketplace bump + every edited SKILL.md's own `version:` bump +
  `scripts/sync-version.mjs` to the next free version at merge-readiness.
- Same-PR wiki re-pins per the freshness gate. Expect at minimum: 58/60 →
  `pdlc-sweep`; 59 → `grounding-wiki-plugin`; 61 → `team-review-plugin`; 62 →
  `educate-plugin`; 63 → `educate-plugin`, `build-plugin`, `handoff-protocol`; 64 →
  `reorient-plugin`, `reorient-run-ownership`; 65 → `gate-runner`,
  `gates-consumption-surface`, `test-suite`; 66 → `build-and-release`,
  `release-pipeline`, `skill-patterns`; plus lockstep stales as they surface.
- NO per-task courses (per-feature policy). Merge commits only; one TASK one PR;
  task-id-led commit subjects with the Co-Authored-By trailer.

## Concurrency & conflict doctrine

- **Hotspots:** `pdlc/skills/sweep/SKILL.md` + `pdlc/skills/sweep/templates/runbook.md`
  + `docs/wiki/pdlc-sweep.md` (58 then 60 — Lane A's serial order exists for this);
  `educate/gates/dod.mjs` + `educate/templates/CLAUDE.md` (62 then 63 — Lane D
  likewise); version lockstep files (`.claude-plugin/marketplace.json`, every
  `plugin.json`, SKILL versions — ALL NINE PRs; serial merges + re-bump at each);
  `docs/wiki/*` (every re-pinning PR); `test/` (most PRs add tests — distinct files,
  but expect INDEX-adjacent churn).
- **Paused tasks are not live lanes:** none at authoring; re-check the board per task.
- Reconcile by what the branch carries: a **pin-carrying branch merges `origin/main`
  in** (squash/rebase/force-push rewrite hashes and stale every carried pin; its PR
  lands as a merge commit, never a squash); a **pin-free branch rebases**. Take main's
  side for anything you didn't deliberately change.
- **Honest re-pin from the start (stricter-now rule):** TASK-58 amends the mechanical
  merge-commit re-pin doctrine this sweep would otherwise run under. Do not wait for it
  to merge — from the first merge-in of this sweep, classify every post-history-move
  staleness through the wiki-update plan loop (RE-PIN-ONLY vs NEEDS-REVIEW against the
  main-side diff); never bump a pin without reading the diff it covers. A stricter
  procedure is always permitted; the doctrine text catches up when 58 lands, and the
  remainder of the sweep follows the amended text.
- After every history move (merge-in or rebase): re-run gates AND the freshness probe
  unconditionally — never gated on whether `docs/wiki/` changed.
- Two hotspot-heavy PRs never merge within one re-ground cycle without a reconcile
  between (merge-in or rebase per the pin rule).
- Conflicting with a sibling session's open PR → the smaller PR merges first.
- **Claim before work:** the FIRST commit of any task claims it — board card →
  In Progress AND the spec number's directory (a stub claims the number) — before any
  spec authoring or code. Push immediately (`git push -u origin <branch>` on first
  commit); never force-push a claim.
- **A rejected push means you lost the race:** fetch, re-read the board and `specs/`.
  If another session now holds that task or number, STOP the lane and surface it.
  Unrelated rejection with the task+number still free → reconcile (merge-in for
  pin-carrying, rebase otherwise) and re-push the claim.
- Verify a PR is merged (`gh api … --jq .merged`) before deleting its branch/worktree;
  never delete+recreate a closed PR's head.
- Root discipline (operator-standing): never switch branches in the shared primary
  checkout — root stays on main; all branch work in `.worktrees/<task>`.

## Operator checkpoints (do not proceed silently)

- **Self-amending doctrine (Lane A):** this sweep edits its own governing skill. The
  stricter-now rule above covers execution; but if 58/60's amendments turn out to
  CONFLICT with how this runbook says to operate (beyond re-pin honesty), stop and
  surface before continuing — that's a runbook amendment.
- **TASK-63 seam ownership (which side writes `handoff.returned`)** — implementation
  judgment bounded by AC#1; record the choice + rationale on the task. Escalate only if
  the chosen owner would need machinery that contradicts build's skill-only-by-design
  doctrine (capsule: build ships no gates/scripts/hooks).
- **TASK-65 consumer contract:** if the fix cannot keep `docs/consuming-gates.md`'s
  0/1/2 exit-code contract intact (i.e. a breaking semantic change for CI consumers is
  unavoidable), stop and surface — that's an outward-facing contract change, not an
  implementation detail.
- **TASK-66 count-claim contract (AC#3):** "update count claims" vs "amend the
  scaffolder's contract" is implementation judgment; record it. Dropping Lane G
  entirely is allowed (tail lane) but is a runbook amendment — note and tell.
- No cross-repo leg anywhere in this sweep: promptworld's sibling fixes are their
  TASK-162. If any task appears to need a promptworld PR, stop and surface.
- Tier escalations; lane amendments (amend this file, note why, tell the operator).

## Done means

TASK-58, 59, 60, 61, 62, 63, 64, 65, 66 all Done on the board, each via its own merged
PR (merge commits); CI green on main; `node --test`, `scripts/check-docs.mjs`, wiki
freshness (hard v2, CAPSULES current), and spec-bridge green at root; `git worktree
list` shows only the primary checkout; this file's log complete and status flipped to
done. Anything short of that is reported as exactly what remains.

## Execution log

| date | task | PR | merge | notes |
|------|------|----|-------|-------|
| 2026-07-26 | (setup) | #82 | 18f8100 | signed-off runbook; gh-pr-merge permission arranged with operator |
| 2026-07-26 | TASK-58 | #83 | 7c2b6cd | honest re-pin doctrine; sweep skill 0.7.0; marketplace 0.28.0; Lane A opener — remaining lanes now follow the amended text |
| 2026-07-26 | TASK-61 | #84 | 4cd0834 | team-review self-review-safe default report path, run-id-keyed; skill 1.2.0; 0.29.0; in-target block now exempts the .handoff transport (posture change noted in PR); follow-up policy question on gitignored residue parked on the card |
| 2026-07-26 | TASK-62 | #85 | 649adf8 | educate vault-less --check converges; decksRequired tolerance; render-at-plant template; start 0.2.0; 0.30.0; corpus: test-suite split summary-style (+test-suite-catalog) — Lane D second (63) unblocked |
