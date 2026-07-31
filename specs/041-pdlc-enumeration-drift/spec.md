# 041-pdlc-enumeration-drift — spec

**Board task:** TASK-74 · **Finding source:** refactor-triage run praxis-2026-07-27-16-07-29
(group A; report §improved 1 and the stale-row half of 6); triage record
docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md; evaluation report
docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

## Problem

The 0.40.0 release added pdlc's third skill (refactor-triage), but every enumerating
surface outside that PR's diff still teaches a two-verb pdlc:

- `pdlc/templates/CLAUDE.md` (the block bootstrap PLANTS — every project bootstrapped
  at ≥0.40.0 inherits the mis-enumeration; highest blast radius).
- `pdlc/.claude-plugin/plugin.json` description and the mirrored
  `.claude-plugin/marketplace.json` pdlc entry (install surface disagrees with
  pdlc/README.md's "Three skills").
- Root `README.md` pdlc role cell (bootstrap only — sweep was already missing,
  pre-existing).
- This repo's own planted `CLAUDE.md` block (header still v0.36.0 — never re-planted).
- `docs/wiki/overview.md` ("pdlc sits before the loop" — now doubly wrong;
  freshness-green only because its pinned sources are the stale files themselves).

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1):** `pdlc/templates/CLAUDE.md`'s pdlc bullet names all three verbs —
  bootstrap, sweep, refactor-triage.
- **R2 (AC #2):** `plugin.json` + `marketplace.json` pdlc descriptions name the third
  skill; keywords gain triage/debt.
- **R3 (AC #3):** root README pdlc role cell consistent with what the plugin ships;
  the style decision (how much detail a role cell carries) recorded in this spec dir
  or the PR.
- **R4 (AC #4):** this repo's CLAUDE.md re-planted at current version via
  pdlc:bootstrap's update path; `docs/wiki/overview.md` re-verified through the
  wiki-update loop (NEEDS-REVIEW — its prose is known-wrong, so amend, never
  mechanically re-pin).
- **R5 (AC #5):** version bumps per docs/releasing.md (released surface: pdlc/ +
  marketplace); gates green.

## Non-goals

- TASK-85 (two-track landing rule, same template file, next in this lane) — do not
  pre-implement.
- No wording changes beyond enumeration consistency — this card fixes drift, not
  doctrine.

## Done means

All five ACs checked on TASK-74; every enumerating surface teaches the same three-verb
pdlc; this repo's planted block is current; overview.md's prose is true again; PR
merged with bumps.
