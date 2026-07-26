# 010-bootstrap-dogfood — pdlc:bootstrap runs on the marketplace repo itself

Board: TASK-43 · Sweep: `docs/design/board-clearing-runbook.md` (Lane 2) ·
Direction: team-review gap #2 (task description) — the suite enforces its tenets
downstream more strictly than at home.

## Problem

praxis has no `.pdlc` sentinel, a hand-rolled CLAUDE.md without the planted grounding
block, and an un-gitignored `.handoff/` despite CLAUDE.md claiming the transport is
gitignored. Running the bootstrap here is also the strongest proof of its
idempotent-append claim: plant markers into an existing, heavily customized CLAUDE.md
without clobbering it.

## Requirements

### R1 — .handoff/ gitignored at root (AC #1)

Add `.handoff/` to the repo `.gitignore`, making the CLAUDE.md claim true. If any
`.handoff/` residue is currently tracked, untrack it (`git rm -r --cached`) — history
stays; the transport stops cluttering status.

### R2 — bootstrap planted (AC #2)

Run the pdlc plant against the repo (use the plugin's own deterministic planter,
`pdlc/scripts/plant.mjs`, the way `pdlc:bootstrap` does — from THIS worktree, against
THIS worktree's root; read the script + its tests first for invocation and peer flags):

- `.pdlc` sentinel present afterward.
- The PDLC grounding block planted into the existing CLAUDE.md as its marked block,
  **appended — every byte of the hand-written content preserved**. Peers: opt into
  Backlog.md (present); Spec Kit is not initialized here (host precedent is
  hand-authored spec dirs) — do NOT run `specify init`; record how bootstrap behaves
  about the absent peer as a dogfood finding.
- **HARD CHECKPOINT (operator-armed):** diff CLAUDE.md before/after. If the plant
  rewrites, reorders, or deletes ANY existing prose (anything beyond appending the
  marked block), STOP immediately and report the diff — do not commit, do not work
  around it.
- Re-run the plant a second time and verify idempotence (no diff) — that's the claim
  being dogfooded.
- `node scripts/check-docs.mjs` must stay green with the planted block in place.

### R3 — end-to-end self-review verification (AC #3)

With the TASK-42 fix on main (team-review 1.1.0): run a team-review self-review of the
repo begin → finish cleanly, from this worktree as both invoking root and target. Drive
the plugin's run lifecycle directly (`team-review/scripts/run.mjs begin … finish …`)
with a minimal honest report artifact satisfying its output gate — the point is the
lifecycle completing (begin exit 0 with the escalated self-review WARN now expected
behavior, finish exit 0 on the untouched target). Record the run id + exit codes in
tasks.md as evidence. The run record lives in `.handoff/` (now gitignored — the
durable evidence is the recorded ids + this spec).

### R4 — grounding

- Docs-only-plus-config diff (CLAUDE.md, .gitignore, .pdlc, specs) → NO version bumps,
  no plugin/lib/scripts edits. If the dogfood exposes a bootstrap bug that needs a
  plugin fix: STOP and report (scope question for the operator), don't fix inline.
- Wiki re-pins as the freshness gate demands (CLAUDE.md is a pinned source for
  `overview`); v2 budgets hard; CAPSULES regen if any description changes. No course.

## Non-goals

Spec Kit installation; plugin code changes; README rewrites (TASK-40's).

## Acceptance

Board ACs #1–#3 map to R1–R3; R4 is hygiene.
