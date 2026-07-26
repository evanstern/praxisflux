# 007-team-review-self-review-gate — .handoff residue must not trip the read-only check

Board: TASK-42 · Sweep: `docs/design/board-clearing-runbook.md` (Lane 1) ·
Direction: team-review finding #1 (doc-1), repro'd live 2026-07-23 (task description).

## Problem

When the invoking root == the reviewed target, `team-review/scripts/run.mjs begin`
snapshots the target BEFORE writing its own run record into `.handoff/`. If `.handoff/`
is not gitignored, the porcelain comparison in `team-review/gates/review.mjs` can never
match again — the plugin's own paper trail trips its own read-only gate, and a
self-review cannot pass without manually relocating run records via `TEAM_REVIEW_HOME`.

## Requirements

### R1 — the transport's residue never counts as target mutation (AC #1)

Fix in the plugin (pick the cleaner of the two AC-sanctioned shapes, or both):
either the porcelain comparison ignores `.handoff/` entries, or the snapshot is taken
after the run record is written. The chosen shape must ALSO hold for `finish` (any
run records written between begin and finish must not read as mutations). Genuine
target mutations must still block — the read-only guarantee is the plugin's core claim.

### R2 — begin escalates the gitignore warning for self-review (AC #2)

When invoking root == target and `.handoff/` is not gitignored: a clear, loud notice
(decide notice-vs-hard-fail and record the decision + reasoning in your report and the
spec tasks.md; default to a prominent WARN — a hard fail would break the fix's own
purpose of making self-review work in repos that never gitignored the transport).

### R3 — regression test (AC #3)

`node --test` coverage reproducing doc-1: begin with invoking root == target, run
record living in-repo (`.handoff/` NOT gitignored), finish PASSES on an untouched
target, and still BLOCKS on a genuinely mutated one. Match the existing team-review
test conventions in test/.

### R4 — releasing + grounding

- Released surface: bump the team-review skill `version:` + marketplace via
  `scripts/sync-version.mjs 0.16.0` (0.15.0 released; if a sibling takes 0.16.0 first,
  the orchestrator handles the post-rebase re-bump).
- Re-verify + re-pin `docs/wiki/team-review-plugin.md` (two-step; capsule ≤500,
  body ≤8000, regenerate `docs/wiki/CAPSULES.md` if its description changes) and any
  other note the freshness gate flags on this diff.
- Course policy: whatever docs/task-courses.md says at your merge time — if TASK-41
  merges first, praxisflux's standing choice is per-feature (no course needed); if you
  merge first, build docs/courses/TASK-42 gate-green. The ORCHESTRATOR calls this at
  merge time; prepare for the with-course case only if asked.

## Non-goals

No TEAM_REVIEW_HOME behavior changes; no transport rename (that's TASK-38); no other
plugin.

## Acceptance

Board ACs #1–#3 map to R1–R3; R4 is release/grounding hygiene.
