---
name: grounded-corpus-spec
description: The grounded-corpus interchange contract (spec v1) — corpus layout, note core, code vs web provenance dialects, freshness semantics, and the low-coupling guardrails
kind: concept
sources:
  - docs/corpus-spec.md
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# The grounded corpus — praxis's interchange contract

A grounded corpus is a directory of interlinked Markdown notes that praxis tools produce
and consume. It is the *only* way praxis tools compose around knowledge: producers write
the format, consumers read it, and no tool ever invokes another. The spec lives at
`docs/corpus-spec.md` (v1).

## How it works

**Layout.** A corpus is a directory with a required `INDEX.md` (one line per note — the
recall surface) whose siblings are frontmattered notes, one concept per note, filename
equal to the frontmatter `name` plus `.md`. Producers may add their own sentinel
(research vaults use `.research-vault`); consumers must not require anything beyond `INDEX.md`.

**Note core.** Frontmatter carries `name` (kebab-case), `description` (the retrieval
handle), and `kind` (`component | concept | pipeline | pattern | note | analysis`). Bodies
are neutral and factual — evaluation belongs only in `kind: analysis` notes. `[[name]]`
links must resolve to sibling notes (or be intentionally reserved in `INDEX.md`). Code is
referenced by file path + symbol name, never line numbers.

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
  notes ad hoc); spec changes bump the version and stay additive within v1.
