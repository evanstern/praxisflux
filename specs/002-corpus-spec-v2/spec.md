# 002-corpus-spec-v2 — token-economy tiers for grounded corpora

Board: TASK-48 · Sweep: `docs/design/wiki-token-economy-runbook.md` (Lane 1) ·
Direction: `vault/Grounded-Wiki-Scaling/Analysis-Token-Economy-for-the-Grounding-Wiki.md`

## Problem

Grounded corpora grow linearly with their subject (docs/wiki: 26 notes ≈ 34k tokens).
Consumers that load "a few dozen pages" pay near-whole-corpus cost per session, and
over-loading degrades answer quality (context rot). Spec v1 defines structure and
provenance but says nothing about **how corpora are consumed** or **how big their units
may grow** — so cost control is habit, not contract.

## Requirements

Amend `docs/corpus-spec.md` from v1 → v2. All changes must keep v1 corpora readable
(consumers must not *require* the new artifacts); the new obligations bind **producers**
going forward.

### R1 — Consumption protocol (new section)

The spec must state the default loading discipline for consumers:

1. `INDEX.md` is always loaded first — it is the routing surface.
2. Notes are loaded **just-in-time**, individually, by routing through the index
   (or capsules, R2); never bulk-load a corpus as default behavior.
3. Whole-corpus orientation reads `CAPSULES.md` (R2), not the note bodies.
4. Within a note, `##` sections are the addressable unit (R4) — consumers needing one
   aspect of a large note read that section, not the file.

### R2 — Capsule tier (new section)

- Every note's `description:` is its **capsule**: ≤ 500 characters (~125 tokens),
  written for routing (what's inside, when to load it), not as a teaser.
- `CAPSULES.md` is a new **generated, optional-for-readers** corpus artifact sitting
  beside `INDEX.md`: for each note, its index line followed by its capsule. It is the
  cheap whole-corpus view (~10× cheaper than note bodies at current sizes).
- `CAPSULES.md` is derived state: producers regenerate it whenever any `description:`
  changes; hand-editing it is an error. It carries a header naming the generator and
  the corpus commit it was generated at (code dialect) so drift is detectable.
- Capsules are drift surfaces: a note edit that changes what the note covers must
  update its capsule in the same pass — the same re-verify discipline as pins.

### R3 — Note size cap + split discipline (new section)

- A note body (excluding frontmatter) must stay ≤ 8,000 characters (~2k tokens).
- At the cap, split summary-style: move subtopics to new child notes; the parent keeps
  a one-paragraph summary of each child plus its `[[wikilink]]`; the child links back.
  INDEX.md gains one line per child.
- **Minimum-content counter-rule:** never split when the child would hold less than
  ~1,500 characters of substance or would merely duplicate the summary left behind —
  an over-cap parent with nothing splittable is acceptable and flagged, not butchered.

### R4 — Section addressability (rule addition to "Note core")

- Note bodies must organize content under `##` headings (short preamble allowed);
  a `##` section is the sub-note addressable unit consumers may load alone.

### R5 — Versioning

- Title becomes "spec v2"; a short "v2 additions" changelog block names R1–R4.
- The v1 guardrail "additive only within v1" evolves: v2 artifacts (`CAPSULES.md`)
  are optional for readers; budgets (R2/R3) bind producers at write/update time.

### R6 — Same-PR grounding

- `docs/wiki/grounded-corpus-spec.md` cites this spec file as a source: re-verify its
  content against v2 and re-pin `verified_against` in the same PR.
- Per-task course `docs/courses/TASK-48/` built and passing the course gate, same PR.

## Non-goals

- No enforcement tooling (gate checks, generators) — that is TASK-49.
- No conformance rework of docs/wiki itself — that is TASK-50.
- No consumer skill changes — that is TASK-51.
- No retrieval/embedding infrastructure and no load-time compression (analysis rejected
  both at this scale).

## Acceptance

Maps 1:1 to TASK-48's board ACs (#1 protocol, #2 capsules, #3 cap+split, #4 sections,
#5 drift coverage, #6 wiki re-pin).
