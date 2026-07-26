---
name: grounded-corpus-spec
description: The grounded-corpus interchange contract (spec v2) — corpus layout, the consumption protocol (INDEX.md-first, just-in-time note loads), the capsule tier and generated CAPSULES.md, the 8k-character note size budget with summary-style splits, section addressability, code vs web provenance dialects, freshness semantics, and the low-coupling guardrails. Load when producing or consuming a corpus, or checking what the format requires.
kind: concept
sources:
  - docs/corpus-spec.md
verified_against: e7fdd779ae15cd949313171084c4a02acff9fa7a
---

# The grounded corpus — praxisflux's interchange contract

A grounded corpus is a directory of interlinked Markdown notes that praxisflux tools produce
and consume. It is the *only* way praxisflux tools compose around knowledge: producers write
the format, consumers read it, and no tool ever invokes another. The spec lives at
`docs/corpus-spec.md` (v2 — v1 defined structure and provenance; v2 added the token
economy: a consumption protocol, a capsule tier, a note size budget, and section
addressability. v1 corpora remain readable; the new artifacts are optional for readers and
the budgets bind producers).

## How it works

**Layout.** A corpus is a directory with a required `INDEX.md` (one line per note — the
recall surface) whose siblings are frontmattered notes, one concept per note, filename
equal to the frontmatter `name` plus `.md`. An optional, generated `CAPSULES.md` sits
beside the index. Producers may add their own sentinel (research vaults use
`.research-vault`); consumers must not require anything beyond `INDEX.md`.

**Consumption protocol.** The corpus grows with its subject; a session's cost must grow
only with its task. Consumers load `INDEX.md` first, always; notes are loaded
just-in-time, individually, by routing through the index (or the capsules) — bulk-loading
a corpus is never default behavior. Whole-corpus orientation reads `CAPSULES.md`, not the
note bodies (falling back to index + just-in-time notes where a v1 corpus has none), and
within a note a `##` section is the addressable unit a consumer may read alone.

**Note core.** Frontmatter carries `name` (kebab-case), `description` (the retrieval
handle), and `kind` (`component | concept | pipeline | pattern | note | analysis`). Bodies
are neutral and factual — evaluation belongs only in `kind: analysis` notes — and organize
content under `##` headings (short preamble allowed), each section standing alone as the
sub-note addressable unit. `[[name]]` links must resolve to sibling notes (or be
intentionally reserved in `INDEX.md`). Code is referenced by file path + symbol name,
never line numbers.

**Capsule tier.** Every note's `description:` is its capsule: at most 500 characters
(~125 tokens), written for routing — what the note covers and when to load it.
`CAPSULES.md` (each note's index line + capsule) is the cheap whole-corpus view, ~10×
cheaper than the note bodies. It is derived state: regenerated whenever any `description:`
changes, never hand-edited, carrying a header that names its generator and the corpus
commit it was generated at. Capsules are drift surfaces — an edit that changes what a note
covers must update its capsule in the same pass, the same re-verify discipline as pins.

**Size budget.** A note body stays at or under 8,000 characters (~2k tokens). At the cap,
split summary-style: subtopics move to child notes, the parent keeps a one-paragraph
summary plus `[[wikilink]]` per child, the child links back, and `INDEX.md` gains one line
per child. Counter-rule: never split when the child would hold under ~1,500 characters of
substance or would merely duplicate the summary — an over-cap parent with nothing
splittable is flagged, not butchered.

**Provenance dialects.** Every note carries provenance in exactly one of two dialects:

- *Code dialect* — `sources:` (every file whose change invalidates the note — no more, no
  less) plus `verified_against:` (the full commit hash the claims were last verified at).
- *Web dialect* — `type: note` (aliased to `kind:` in this spec), `created`/`updated`
  dates, and a `## Grounding` section citing `[[_grounding]]` claims or `[source](url)`
  links. `updated` is the web dialect's pin.

**Freshness.** A note is stale when its provenance no longer proves its content: for the
code dialect, any `sources:` path changed after `verified_against:` (mechanically checked
by [[grounding-wiki-plugin]]'s freshness gate); for the web dialect, `updated` exceeds the
consumer's tolerance or a cited source is gone. Stale notes are re-verified and re-pinned,
never deleted — and a pin must never be bumped without re-reading the underlying diff.

## Connections

- Producers: [[research-plugin]] (web dialect) and [[grounding-wiki-plugin]] (code dialect).
- Consumers: [[research-plugin]]'s analyze/render phases, [[codebase-to-course-plugin]]
  (course briefs), [[educate-plugin]] (lesson grounding), [[build-plugin]] (SPEC citations).
- [[gates-convention]] — staleness can block via gates, but consumers degrade gracefully.

## Operational notes

- Guardrails: no per-consumer fields in notes (sidecar files instead); consumers must work
  without a corpus (it makes tools cheaper, never a hard dependency); producers own their
  notes' truth (consumers file errors back, e.g. run `wiki-update`, rather than patching
  notes ad hoc); spec changes bump the version and stay readable by existing consumers —
  v2's artifacts are reader-optional and its budgets bind producers at write/update time.
- Enforcement of the v2 budgets (gate checks, a CAPSULES.md generator) is deliberately not
  in the spec — the spec states the contract; tooling lands separately.
