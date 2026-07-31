# 044-wiki-budget-headroom — spec

**Board task:** TASK-78 · **Finding source:** refactor-triage run praxis-2026-07-27-16-07-29
(group E; report §improved 8); triage record
docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md.

## Problem

Three corpus-budget pressure points, each one honest amendment away from a gate
collision or a silent rot channel:

1. `docs/wiki/test-suite-catalog-plugins.md` body sits near its 8,000-char cap and
   grows by appending (TASK-76 adds test-catalog bullets next in this lane) — the next
   honest amendment collides with the size gate, incentivizing shave-a-word fixes.
2. `docs/wiki/pdlc-refactor-triage.md` `description:` sits at 487/500 after TASK-80's
   reword (was 499) — still one adjective from breaking the capsules gate.
3. The same note's Handing-off prose asserts sweep specifics grounded in
   `pdlc/skills/sweep/SKILL.md`, which is NOT in its `sources:` — prose that can rot
   with the freshness gate green.

## Requirements (map 1:1 to the card's ACs)

- **R1 (AC #1) — summary-style split:** split `test-suite-catalog-plugins` per
  docs/corpus-spec.md's summary-style split so each resulting note has comfortable
  headroom (target: each body comfortably under ~6,500 so TASK-76's additions fit);
  INDEX and inter-note links updated; freshness green.
- **R2 (AC #2) — description trim:** trim `pdlc-refactor-triage.md`'s `description:`
  below ~480 chars without losing the four-entry-modes accuracy TASK-80 just shipped;
  regenerate CAPSULES.md in the same slice.
- **R3 (AC #3) — gate-visible cross-claims:** the note's sweep cross-claims become
  gate-visible: either add `pdlc/skills/sweep/SKILL.md` to its `sources:` (and verify
  the prose against the current 0.15.0-era skill) or de-specify the prose to lean on
  the `[[pdlc-sweep]]` wikilink instead of restating specifics. Prefer de-specifying —
  it keeps the note's source footprint (and future stale-churn) small.

## Non-goals

- Wiki-only → **no version bump** (docs/releasing.md: released surface untouched).
- TASK-76's new test-catalog bullets — next in this lane; this task only makes room.
- No content changes to pdlc-refactor-triage beyond the description trim and the
  cross-claim de-specification.

## Done means

All three ACs checked on TASK-78; both notes' budgets have real headroom; every claim
in pdlc-refactor-triage is covered by its sources or delegated to a wikilink; CAPSULES
current; freshness green; PR merged (no bump).
