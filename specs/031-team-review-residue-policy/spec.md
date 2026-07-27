# 031-team-review-residue-policy — self-review reports are evidence, and evidence lives tracked

Board: TASK-70 · Direction: policy question parked by TASK-61 (PR #84) during the
downstream-bugfix sweep (`docs/design/downstream-bugfix-runbook.md`); carding approved
by the operator 2026-07-27; POLICY DECIDED by the operator at lane sign-off 2026-07-27
(`docs/design/sweep-followups-runbook.md`, Operator checkpoints): option (b),
tracked-by-default.

## The question, and the ruling

TASK-61 moved team-review's default report path under the runs home
(`reportsDirFor(cwd)`, on the `.handoff/` transport). On a self-review — invoking root
== reviewed target — that puts the report, the review's durable deliverable, in the
target's own gitignored transport: untracked residue. The repo's handoff principle
says transport is gitignored while EVIDENCE lives in tracked state. The operator ruled:
a review report IS evidence. Self-review defaults must land it durably tracked, without
reintroducing the in-target gate deadlock TASK-61 fixed.

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — ONE rule, recorded in both `team-review/skills/team-review/SKILL.md` and
`docs/wiki/team-review-plugin.md`: a review report is evidence and lives in tracked
state; the transport is transient plumbing; on self-review the default flow lands the
proven report at a tracked location (run records stay on the transport as today — the
card already accepts their durability story).

R2 (AC #2) — behavior matches the rule on pure defaults: a self-review begun with NO
`--report` finishes with the proven report present at a tracked, run-id-keyed location
in the target (prior art for the shape: `docs/reviews/team-review-<run-id>.md`), with
the run record naming both paths. Copy-on-finish AFTER the output gate passes keeps the
TASK-61 deadlock fix intact (the untouched-target check never sees the tracked copy).
Explicit `--report` always wins (no copy); non-self-review flow unchanged; begin's
self-review WARN tells the operator where the report will durably land.

R3 (AC #3) — TASK-61's tests stay green (default-path round trip, same-day distinct
report paths, deadlock regression); a new test proves the pure-defaults self-review
round trip ends with the tracked copy on disk and recorded on the run.

## Non-goals

- No change to third-party review doctrine (reviews of OTHER repos stay read-only;
  reports there were never the problem — the invoking root differs from the target).
- No relocation of run records off the transport; no new required flags.
