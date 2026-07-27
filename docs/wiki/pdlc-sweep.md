---
name: pdlc-sweep
description: The pdlc:sweep skill — the board-sweep orchestrator; authors a dependency-laned, operator-signed-off runbook over board tasks, then executes each through spec → link → worktree → delegated implementation → PR → serial merge → re-ground, under concurrency doctrine for shared repos — claim-before-work, paused-lane markers, merge-drift gates, pin-aware reconciliation (pin-carrying branches merge main in; pin-free rebase), and honest post-merge-in re-pins classified against the main-side diff.
kind: component
sources:
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
verified_against: cad8211058c905136a438e0bdaf13de6ced4fcf5
---

# pdlc:sweep — the board-sweep orchestrator

`skills/sweep/SKILL.md` (with `skills/sweep/templates/runbook.md`) — the second skill of
the [[pdlc-plugin]], added in 0.12.0 — orchestrates a **set of board tasks** into merged
PRs. The orchestrator plans, dispatches, and gates; it never implements inline. Two
phases, gate → work → gate:

- **Author:** from task ids / a label / a synthesis doc, derive dependency-ordered
  **lanes** (the governing rule is *develop in parallel, merge serially*; contract-shaped
  work leads — a published interface unblocks consumers), per-task model tiers from the
  host rubric, the project's per-PR gates enumerated, concurrency doctrine with named
  hotspots, operator checkpoints, and a done-means — written to
  `docs/design/<slug>-runbook.md`, committed, then **stopped for operator sign-off** on
  the lanes.
- **Execute:** per task, the host PDLC loop instantiated — root freshness, then
  **claim before any spec authoring** (an explicit loop step: cut the worktree from
  `origin/main` — which does not yet contain the spec; the spec is authored on the
  branch, after the claim — then the branch's first commit claims the task: board
  card → In Progress plus the spec number's directory stub; push -u immediately,
  never force-push a claim; a rejected push means the race was lost: re-read the
  board/`specs/`, surface genuinely contended work to the operator, otherwise merge
  `origin/main` into the claim branch and plain re-push — rebase-ban-safe, never a
  force-push), Spec Kit cycle on the claimed branch, `spec-bridge:link`, delegated
  implementation (never inline), per-PR gates, reconcile with `origin/main` (see the
  pin rule below), PR, serial merge with verify-merged-before-cleanup, re-ground
  (ticks before sync — see below), one execution-log line.

Since 0.12.1 both phases consume a host **merge-drift gate** when the precondition probe
finds one (`scripts/check-merge-drift.mjs`, the promptworld spec-051 pattern; since
0.31.0 the probed inventory is four modes — `session`/`claim`/`worktree`/`pr` —
identical in SKILL and runbook template, with the four invocations recorded verbatim):
`session` at sweep start subsumes the root fetch/ff-pull and feeds its drift matrix
into lane construction, `claim --dir <NNN>-<slug>` blocks on a taken spec number
before any new `specs/NNN-*` dir, `worktree [--spec <NNN>] [--task TASK-<n>]`
mechanizes the fresh-root and spec-number checks when cutting the worktree, and `pr`
blocks each `gh pr create` (re-run after every history move) on predicted conflicts.
The runbook records the probe result; with no gate the raw git doctrine stands. Since
0.13.0 the runbook template's concurrency doctrine carries the fuller
claim-before-work doctrine above and names the gate's mechanical checks.

Since 0.14.0 sweep's two whole-corpus orientation moments (runbook authoring's project
reading, each task's re-ground) consume the corpus per [[grounded-corpus-spec]] v2 —
`CAPSULES.md` when present, full note bodies only for touched concepts, `INDEX.md` plus
just-in-time notes on a v1 corpus without a rollup.

Since 0.25.0, a **paused-lane marker**: a task labeled `paused` (set/cleared only via
`backlog task edit --labels`, provenance as a "paused by \<who\> \<date\>: \<why\>"
append-note, machine-findable in frontmatter `labels:`) is not a live lane — authoring
excludes it from lane conflict analysis, lists it "paused — untouched"; execution never
claims, rebases, or cleans its branches/worktrees; merge-drift hosts downgrade its
findings to info.

Since 0.27.0 the concurrency doctrine splits reconciliation by what the branch carries
(promptworld field evidence, operator-ratified): a **pin-carrying branch** — one whose
own commits are referenced by re-pins it carries, routine on wiki-in-PR hosts — **merges
`origin/main` into the branch**, because squash, rebase, and force-push all rewrite the
branch's hashes and stale every carried pin at once; only a merge commit keeps the old
hashes reachable, which is also why such a branch's PR lands as a merge commit, never a
squash. **Pin-free branches still rebase.** And after every history move — merge-in or
rebase — the gates AND the freshness probe re-run unconditionally, never gated on
whether `docs/wiki/` changed: pins also reference design-reference files outside the
wiki, so a wiki-untouched diff can still be stale.

Since 0.28.0 (skill 0.7.0) the re-pin leg is honest by doctrine: 0.27.0's mechanical
"re-pin conflicted pins to the merge commit" instruction is superseded — pin = merge
commit empties the freshness probe's `git log <pin>..HEAD -- <sources>` range by
construction, so it could green the gate over a note contradicting main-side code. A
merge-in licenses no pin bump; every stale or conflicted pin routes through the
wiki-update plan loop's classifier ([[grounding-wiki-plugin]]) against the main-side
diff over the note's sources (`git diff <old-pin>..<merge-commit> -- <sources>`):
**RE-PIN-ONLY** where the diff provably can't invalidate prose, **NEEDS-REVIEW** where
the prose is re-verified and amended before any bump. The merge commit remains the
*target* of an honest re-pin, never its *justification*. Both files also state the safe
procedure for downstream hosts that inherited the old convention: keep the merge-in,
drop the mechanical re-pin, classify-then-pin, and treat pins already bumped under it
as suspect at the next update pass.

Since 0.31.0 (skill 0.8.0) the doctrine set is internally reconciled (TASK-60): the
Phase 2 loop carries an **explicit claim step** stating the one ordering both files
share — the claim commit (board → In Progress + spec dir stub, pushed -u) precedes
spec authoring, and the worktree-cut instruction says outright that `origin/main`
does not yet contain the spec; the **rejected-claim remedy is merge-based** (fetch +
merge `origin/main` into the claim branch + plain re-push — executable under a
repo-wide rebase ban, never needing the force-push a claim forbids) in SKILL,
template, and this note alike; the drift-gate inventory is the same four modes in
both files; and the **re-ground step orders ticks before sync** — tick the spec's
tasks.md at root, then `spec-bridge:sync`, whose derived plan is the only path that
moves a linked task to Done ([[spec-bridge-plugin]] doctrine) — the sweep never
hand-sets Done on a linked task.

The runbook is the **session-portable contract**: a fresh session resumes the sweep from
it plus the board alone. Because a runbook is an instruction-bearing artifact a session
*obeys*, the adopt path verifies authority before obeying — status verifiably signed-off
(only the operator flips draft → signed-off), committed, and board-backed — refusing
anything unverifiable. Phase separation ([[skill-patterns]]) holds: sweep decides no
direction (that arrives from reorient/team-review/the operator) and writes no code.
