# 018-sweep-merge-over-rebase — pin-carrying task branches merge, never rebase

Board: TASK-57 · Direction: field evidence from the promptworld reorient 2026-07-26
sweep (runbook `docs/design/reorient-2026-07-26-sweep-runbook.md` there; PRs
#113/#115/#116/#119), operator-ratified 2026-07-26 ("we want merges over rebases to
preserve those hashes").

## The failure the doctrine caused

The sweep skill's concurrency doctrine says "rebase, never merge-commit into a task
branch". On hosts with a spec-069-style wiki-in-PR lifecycle, in-branch re-pins are
**branch commit hashes** — a rebase rewrites every hash the branch carries and stales
every pin at once (43 pins on one lane, 89 on another, live). All three
history-rewriting moves break pins the same way: **squash, rebase, force-push**. Only a
merge commit keeps the old hashes reachable. Three lanes merged `origin/main` into
their branch instead; the host's merge-drift `pr` gate accepted it every time.

Sibling gap found on the same sweep: the merge-drift `pr` gate's docs-stale probe only
fires when `docs/wiki/` changed, but pinned pages also pin design-reference files
(promptworld's `docs/design/tui/*`) — a `keymap.md`-only change went stale invisibly.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — `pdlc/skills/sweep/SKILL.md` + `pdlc/skills/sweep/templates/runbook.md`
concurrency doctrine rewritten:

- A **pin-carrying branch** (any branch whose commits are referenced by re-pins it
  carries — wiki notes, design-reference pins) reconciles with `origin/main` by
  **merging main into the branch**; conflicted pins re-pin to the merge commit.
- All three history-rewriting moves are named as pin-breaking: squash, rebase,
  force-push. Merge commits are the only reconcile that keeps old hashes reachable —
  this is also why sweep-merged PRs on such hosts must merge with merge commits, never
  squash.
- **Rebase remains the rule for pin-free branches** — the old doctrine survives scoped,
  not deleted.
- Execute-loop step 7 (pre-PR reconcile) and the dependent doctrine bullets ("two
  hotspot-heavy PRs…", "sibling sessions rebase main…") updated to match.

R2 (AC #2) — the freshness probe runs **directly after every history move** (merge of
main into the branch, rebase of a pin-free branch), unconditionally — never gated on
"did `docs/wiki/` change", because pins also reference design-reference files outside
the wiki. Prescribed in both SKILL.md and the runbook template's doctrine section.

R3 (AC #3) — versions per `docs/releasing.md`: sweep SKILL.md `version:` 0.5.0 → 0.6.0
(behavior change users notice — minor), marketplace `scripts/sync-version.mjs 0.27.0`.
Wiki: re-verify + re-pin `docs/wiki/pdlc-plugin.md` (+ lockstep stales); CAPSULES regen
if the note description changes.

## Non-goals

- Changing the host-side merge-drift gate itself (promptworld's
  `scripts/check-merge-drift.mjs` probe conditions are that repo's own task).
- Any change to praxisflux's own CI gates or merge policy (already merge-commit-only).
