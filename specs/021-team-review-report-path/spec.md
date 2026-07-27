# 021-team-review-report-path — self-review must not deadlock on its own default

Board: TASK-61 · Direction: downstream bug-find sweep from promptworld (2026-07-27)
against praxis decaa14 (v0.27.0); carded 6c053c2; executed under
`docs/design/downstream-bugfix-runbook.md` (Lane C). Reproduced live.

## The failure

`team-review/scripts/run.mjs:53` defaults the report path to
`join(process.cwd(), team-review-<target>-<date>.md)`. On a self-review — `begin .`
from inside the target, a case the skill explicitly sanctions — that default lands
*inside* the target, and `gates/review.mjs:104-105` unconditionally blocks any report
inside the reviewed repo. Live repro: `begin .` then `finish` exits 2 with exactly that
block; the only escape is having passed `--report <outside-path>` up front. In a git
target the in-repo report additionally trips the porcelain-drift ("target untouched")
check. `skills/team-review/SKILL.md:38-39` compounds it by asserting the default is
never inside the target — false whenever cwd == target. Related defect in the same
default: the date-keyed filename collides across two same-day runs of one target;
reorient already fixed this class run-id-keyed (`reorient/scripts/run.mjs:163-165`).

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — `begin .` (and any begin where the resolved default would fall inside the
target) resolves the default report path **outside the target** — e.g. under the runs
home (`TEAM_REVIEW_HOME` / the `runsDirFor` root) — and a subsequent `finish` passes on
a self-review without `--report`. An explicit `--report` is honored unchanged
(including the existing behavior of blocking one placed inside the target).

R2 (AC #2) — `skills/team-review/SKILL.md`'s report-path claim matches the actual
resolution rule after the fix (no "never inside the target by construction" claim that
cwd == target falsifies).

R3 (AC #3) — default report filenames are unique per run: run-id-keyed (or equivalent
uniqueness), not date-keyed; two same-day runs of one target never collide. Follow
reorient's prior art.

R4 (AC #4) — a test covers the self-review round trip: `begin .` from inside a target
→ report written at the default path → `finish` passes; plus same-day double-run
filename uniqueness.

Versions per `docs/releasing.md`: team-review skill `version:` bump + marketplace
`sync-version` next free. Wiki: re-verify + re-pin `docs/wiki/team-review-plugin.md`
(+ lockstep stales); CAPSULES regen if the description changes.

## Non-goals

- Changing the review gate's in-target block for *explicit* paths — that rule is
  correct; only the default must stop violating it.
- The `.handoff` residue / run-record self-review allowances (TASK-42, spec 007 —
  already shipped).
