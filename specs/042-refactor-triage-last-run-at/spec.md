# 042-refactor-triage-last-run-at — spec

**Board task:** TASK-80 · **Finding source:** operator-observed gap, 2026-07-27 — the
TASK-73 sweep merged b4e8e09..52b5abd after triage run praxis-2026-07-27-16-07-29, and
only an operator reminder got that range scanned.

## Problem

The triage scope is always explicit (`--range xxx..yyy` or whole-repo): nothing records
how far the last run scanned, so a post-sweep triage scoped to the new sweep's range
silently skips any merges that landed between the previous triage and that sweep's
base. The operator must remember to widen the range by hand.

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1) — durable high-water mark:** every refactor-triage run writes a
  machine-findable **last-run-at commit id** into its tracked triage record in
  `docs/reviews/` — the id its scan actually reached (the range's right endpoint, or
  HEAD at scan time for whole-repo runs). The format is documented in the skill so a
  later run (or a human) can extract it mechanically.
- **R2 (AC #2) — 'since last triage' scope entry:** the skill's Scope phase gains a
  third entry: resolve the most recent triage record's last-run-at and use
  `<that-id>..HEAD` as the range; verify the range resolves (the recorded id may have
  been garbage-collected or the record malformed); when no prior record exists, STOP
  with a clear message — never guess a range.
- **R3 (AC #3) — release mechanics:** refactor-triage skill `version:` 0.2.0 → 0.3.0 +
  marketplace lockstep bump per docs/releasing.md; `node --test` and check-docs green;
  `docs/wiki/pdlc-refactor-triage.md` re-verified against the diff and re-pinned.

## Non-goals

- TASK-77's orient.mjs `--since` (the eval engine's range view) — closed as not-needed
  by operator decision 2026-07-31; this card is triage bookkeeping, not engine work.
  Do not conflate.
- No change to the triage record's other contents or the run-id rule TASK-75 just
  shipped (0.2.0) — last-run-at is an insertion into that settled surface.

## Done means

All three ACs checked on TASK-80; a triage record's last-run-at is machine-findable
per the documented format; the Scope phase resolves it or stops honestly; PR merged
with bumps and a re-verified wiki note.
