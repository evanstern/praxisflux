# 003-wiki-capsules-enforcement — generate + enforce corpus-spec v2 tiers

Board: TASK-49 · Sweep: `docs/design/wiki-token-economy-runbook.md` (Lane 2) ·
Contract: `docs/corpus-spec.md` **v2** (merged in TASK-48/PR #57 — read it first; it governs).

## Problem

Corpus-spec v2 defines the capsule tier (≤500-char `description:` capsules, generated
`CAPSULES.md`) and the note size budget (≤8,000-char bodies, summary-style splits), but
nothing generates the rollup and nothing enforces the budgets — token economy is still a
habit. The grounding-wiki plugin owns corpus production and the freshness gate, so both
land there.

## Requirements

### R1 — CAPSULES.md generation

- A generator (chassis-style module + CLI entry in the grounding-wiki plugin, mirroring
  how the freshness gate is shipped) that renders `CAPSULES.md` for a corpus dir:
  header naming the generator and the corpus commit it was generated at, then for each
  note its `INDEX.md` line followed by its capsule (`description:`), in INDEX order.
- Deterministic and idempotent: same corpus state → byte-identical output.
- `wiki-build` and `wiki-update` SKILL.md instructions updated: regenerating CAPSULES.md
  is part of every build/update pass (per v2 "producers regenerate it whenever any
  description changes").

### R2 — Budget enforcement in the freshness gate

Enforcement keys on **v2 adoption, signalled by `CAPSULES.md` existing** in the corpus
(the artifact v2 already defines — no new contract surface). This keeps not-yet-adopted
corpora (including docs/wiki until TASK-50) green while making budgets hard once adopted:

- **Adopted corpus (CAPSULES.md present):**
  - a note `description:` over 500 characters → FAIL, naming the note and the overage;
  - a note body over 8,000 characters → FAIL, message pointing at v2's summary-style
    split rule — unless the note's frontmatter carries `size_budget_exempt: <reason>`
    (v2's "an over-cap parent with nothing splittable is acceptable — flag it"), in
    which case → WARN;
  - `CAPSULES.md` stale (regenerate-and-compare mismatch, or hand-edited) → FAIL with
    the regeneration command named.
- **Unadopted corpus (no CAPSULES.md):** the same checks emit WARN-level notices only
  (visibility during adoption; nothing blocks).

### R3 — Tests

`node --test` coverage: generator determinism + header content; INDEX-order fidelity;
adopted-corpus failures (over-budget capsule, over-cap body, stale/hand-edited rollup);
`size_budget_exempt` downgrade to warn; unadopted-corpus warn-only behavior; existing
freshness behavior unchanged.

### R4 — Releasing

- `wiki-build` and `wiki-update` SKILL.md `version:` bumps; marketplace bump via
  `scripts/sync-version.mjs` (0.14.0 if first of Lane 2 to merge; the second merger
  rebases and re-bumps — runbook doctrine).

### R5 — Same-PR grounding

- Re-verify + re-pin `docs/wiki/grounding-wiki-plugin.md` (its sources change).
- If any doc under `docs/` pinned by other notes changes, re-pin those too (check the
  freshness gate's own output).
- Per-task course `docs/courses/TASK-49/`, course gate green.

## Non-goals

- No conformance rework of docs/wiki (TASK-50 trims capsules, splits notes, generates
  the real CAPSULES.md, flipping enforcement on).
- No consumer skill changes (TASK-51).
- No changes to docs/corpus-spec.md — if implementation finds a budget unworkable, STOP
  and surface to the orchestrator (operator checkpoint), don't edit the contract.

## Acceptance

Maps to TASK-49's board ACs: #1 generation (R1), #2 capsule-budget fail (R2), #3 size-cap
fail (R2), #4 rollup staleness detection (R2), #5 tests (R3), #6 versions (R4).
