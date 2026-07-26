# 004-consumer-index-first-routing — corpus-spec v2 loading protocol reaches consumers

Board: TASK-51 · Sweep: `docs/design/wiki-token-economy-runbook.md` (Lane 2) ·
Contract: `docs/corpus-spec.md` **v2** "How consumers load a corpus" (merged in TASK-48 —
read it first; it governs the wording).

## Problem

Corpus-spec v2 defines the consumption protocol (INDEX-first, just-in-time notes,
CAPSULES.md for whole-corpus orientation, never bulk-load), but no consumer states it.
The always-on grounding pdlc plants says nothing about how to load the wiki; sweep and
reorient — the two whole-corpus consumers — orient on full note bodies.

## Requirements

### R1 — pdlc planted grounding states the protocol

`pdlc/templates/CLAUDE.md` (the marked grounding block `pdlc:bootstrap` plants): add a
compact wiki-loading rule to the block — when a grounded corpus (docs/wiki or similar)
is present: load `INDEX.md` first and route; load notes just-in-time, never bulk-load;
whole-corpus orientation reads `CAPSULES.md` when it exists (v1 fallback: INDEX +
just-in-time). Keep it to a few lines — the planted block is always-on context and pays
its own token cost. If the template's marked-block mechanics require it (scripts/plant.mjs
stamps/verifies the block), keep the marker structure intact — read
`pdlc/scripts/plant.mjs` and its tests before editing.

### R2 — sweep orients on capsules

`pdlc/skills/sweep/SKILL.md`: where the flow reads project grounding for orientation
(runbook authoring "Read every input task … and the project's own gate machinery";
re-ground steps), instruct: whole-corpus orientation via `CAPSULES.md` when present,
full notes only for the specific concepts the task touches.

### R3 — reorient evaluators prefer the capsule rollup

`reorient/skills/reorient/SKILL.md` (and any evaluator-prompt template it carries):
evaluators ground against the project wiki via `CAPSULES.md` when present, loading full
notes on demand for claims they actually cite; absent a rollup, INDEX-first per v2.
Add one line noting the open A/B question (capsules-only vs full notes evaluator
quality) so the next reorient run records findings — the experiment itself is NOT this
task's scope.

### R4 — Releasing

Version bumps per docs/releasing.md: `pdlc:bootstrap` (template is part of its skill
surface — confirm which skill dir owns templates/CLAUDE.md; bump the owning skill(s)),
`pdlc:sweep`, `reorient:reorient` SKILL.md versions; marketplace via
`scripts/sync-version.mjs` (0.14.0 if first of Lane 2 to merge; the second merger
rebases and re-bumps — runbook doctrine).

### R5 — Same-PR grounding

- Re-verify + re-pin `docs/wiki/pdlc-plugin.md` and `docs/wiki/reorient-plugin.md`
  (their sources change).
- Per-task course `docs/courses/TASK-51/`, course gate green.

## Non-goals

- No CAPSULES.md generation or enforcement (TASK-49, running in parallel — do NOT touch
  grounding-wiki/, lib/, scripts/, or docs/corpus-spec.md).
- No docs/wiki conformance work (TASK-50).
- No running the A/B experiment.

## Acceptance

Maps to TASK-51's board ACs: #1 planted protocol (R1), #2 sweep capsules (R2),
#3 reorient capsules (R3), #4 versions (R4).
