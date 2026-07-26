# 013-design-inputs-rename — untangle docs/handoffs (tracked notes) from .handoff/ (transport)

Board: TASK-38 · Sweep: `docs/design/board-clearing-runbook.md` (tail lane) ·
Direction: TASK-35's vendored review input (process residue finding, task description).

## Problem

The tracked `docs/handoffs/` directory (session notes, vendored design inputs) shares a
name stem with the gitignored `.handoff/` runtime transport (`lib/handoff.mjs`), and the
two are unrelated — a reader greps one and finds the other. The transport name is
released surface and must not change; the tracked docs dir is cheap to rename.

## Requirements

### R1 — rename exactly one (AC #1)

`git mv docs/handoffs docs/design-inputs`. The `.handoff/` transport contract
(handoff-protocol.md, lib/handoff.mjs, pdlc gitignore planting) is untouched.

### R2 — every live reference resolves (AC #2)

Grep the repo for `docs/handoffs` and update every live reference to
`docs/design-inputs`: known citers are `team-review/README.md` and wiki notes
(`team-review-plugin`, `skill-patterns` history) — trust the grep over this list.
Historical references inside `backlog/tasks/*` files stay as-is (do not edit board
files). After the sweep: `grep -r "docs/handoffs" --exclude-dir=backlog` returns only
intentional historical mentions if any doc explicitly quotes history — target zero.
check-docs and wiki-freshness green (renamed paths in `sources:` mean the affected
notes re-verify + re-pin honestly, two-step).

### R3 — the distinction is stated (AC #3)

A short `docs/design-inputs/README.md` (new) states what the dir is (tracked session
notes and vendored design inputs) and explicitly distinguishes it from the gitignored
`.handoff/` runtime transport, cross-linking `docs/handoff-protocol.md`; and
`docs/handoff-protocol.md` gains one reciprocal sentence — so the collision cannot
silently return.

### R4 — releasing + grounding

- `team-review/README.md` edit = released surface → marketplace
  `scripts/sync-version.mjs 0.21.0` (0.20.0 released). No skill edits expected.
- Wiki re-pins per the gate (notes whose `sources:` name the moved files must have
  their sources lists updated to the new paths AND re-pin); budgets hard; CAPSULES
  regen if descriptions change. No course.

## Non-goals

Renaming `.handoff/` or any transport API; editing historical board files.

## Acceptance

Board ACs #1–#3 map to R1–R3; R4 is hygiene.
