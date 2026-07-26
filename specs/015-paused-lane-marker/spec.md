# 015-paused-lane-marker — paused In Progress lanes read as non-blocking

Board: TASK-55 · Sweep: `docs/design/lane-hardening-runbook.md` (Lane 1) ·
Direction: promptworld pause observation (board description) · Operator decision at
sign-off 2026-07-26: the merge-drift gate stays HOST-side; this task ships BOTH legs —
a praxis PR and a promptworld PR — and is Done only when both are merged.

## Requirements (map to board ACs)

### Praxis leg

R1 (AC #1) — the paused marker convention, documented: a `paused` label on the task,
set/cleared only via `backlog task edit --labels`, with pause provenance recorded as an
append-note ("paused by <who> <date>: <why>"). Document it where sweep doctrine lives
(the sweep SKILL.md and/or a short docs/ home the SKILL references — one story).
Machine-findable = the label in the task file's frontmatter `labels:` list.

R2 (AC #3) — `pdlc/skills/sweep/SKILL.md` + its `templates/runbook.md`: runbook
authoring EXCLUDES paused tasks from lane conflict analysis; the runbook template gains
a header slot listing them "paused — untouched"; the sweep never claims, rebases, or
cleans a paused task's branches/worktrees.

R3 (AC #4) — versions: pdlc:sweep SKILL.md bump + marketplace
`scripts/sync-version.mjs 0.23.0` (sibling-collision re-bump is the orchestrator's).
Wiki re-pins (`pdlc-plugin` + lockstep stales); CAPSULES regen if descriptions change.
No course.

### Promptworld leg (AC #2) — separate repo, its own PR

In /Users/evanstern/evan/promptworld (worktree per THEIR doctrine, merge-drift gates at
their choke points, their claim-before-work: a board card + spec dir stub claim first):
`scripts/check-merge-drift.mjs` downgrades a paused task's branch/worktree findings
from blocking to info in ALL THREE modes (session/worktree/pr), with the pause noted as
evidence. Paused detection reads the task file's `labels:` for `paused` (match praxis's
convention). Covered by their test conventions if the script has tests; otherwise a
deterministic manual proof recorded in their PR body.

## Non-goals

Upstreaming the merge-drift gate into praxisflux (future task, operator approval
required); Backlog.md custom statuses unless labels prove unworkable (mechanism swap is
allowed within scope if so — record it).
