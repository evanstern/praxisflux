# The grounded corpus — praxisflux's interchange contract (spec v1)

A **grounded corpus** is a directory of interlinked Markdown notes that praxisflux tools
produce and consume. It is the *only* way praxisflux tools compose around knowledge: producers
write the format, consumers read it, and **no tool ever invokes another**. Anything that can
write this format participates in the ecosystem; anything that can read it benefits from
every producer.

Known producers: `research-vault` (web-grounded branches), `grounding-wiki` (code-grounded
wikis). Known consumers: `analyze-vault` (Q&A/synthesis), `vault-artifact` (render),
codebase-to-course (course briefs), educate (lesson grounding), build (SPEC citations).
reference-repo can ingest a corpus via its markdown parser and serve it over MCP.

## Corpus layout

```
<corpus-root>/
  INDEX.md          # required: one line per note — the recall surface
  <name>.md         # one note per concept; filename = frontmatter name + .md
  ...
```

A corpus is recognized by an `INDEX.md` whose siblings are frontmattered notes. Producers
may add their own sentinel (research vaults use `.research-vault`); consumers must not
require one beyond `INDEX.md`.

## Note core (all dialects)

```markdown
---
name: <kebab-case, matches filename>
description: <one line — used to decide relevance during recall>
kind: component | concept | pipeline | pattern | note | analysis
---

# <Title>

Neutral, factual body. Structure the facts; don't argue a position (evaluation belongs in
kind: analysis notes). Link related notes with [[name]]. Reference code by file path +
symbol name, never line numbers.
```

Rules:
- `[[name]]` targets must resolve to a sibling note (or be intentionally reserved in INDEX.md).
- One concept per note; the note's `description` is its retrieval handle — write it for recall.

## Provenance dialects

Every note must carry provenance in exactly one of two dialects. Provenance is what makes a
corpus *grounded* rather than merely written.

**Code dialect** — the note describes source code in a git repo:

```yaml
sources:                # every file whose change invalidates this note — no more, no less
  - internal/reranker/reranker.go
verified_against: <full commit hash the claims were last verified at>
```

**Web dialect** — the note describes external knowledge (research-vault's shape):

```yaml
type: note              # research vaults use type:; kind: is its alias in this spec
created: YYYY-MM-DD
updated: YYYY-MM-DD
```

plus a `## Grounding` section citing `[[_grounding]]` claims and/or `[source](url)` links
where claims are made. `updated` is the web dialect's pin.

## Freshness semantics

A note is **stale** when its provenance no longer proves its content:

- Code dialect: any path in `sources:` changed after `verified_against:`
  (mechanically checkable — `grounding-wiki`'s freshness gate does exactly this).
- Web dialect: `updated` is older than the consumer's tolerance, or a cited source is gone.

A stale note is not deleted — it is re-verified and re-pinned (see the `wiki-update` skill).
**Never bump a pin without re-reading the underlying diff/sources**; a dishonest pin is
worse than a stale note. Gates may block on staleness (pre-merge checks, Stop hooks), but
consumers should degrade gracefully: use the note, surface its staleness.

## Guardrails (what keeps this low-coupling)

1. **No per-consumer fields.** The moment notes grow `course_hints:` or `lesson_level:`,
   coupling returns through the format. Consumers needing extra data keep **sidecar files**
   that reference notes by `[[name]]` — never write into the notes.
2. **Consumers must work without a corpus.** A corpus makes a tool cheaper/better, never
   becomes a hard dependency.
3. **Producers own their notes' truth.** A consumer that spots an error files it back to
   the producer's process (e.g. run `wiki-update`), it doesn't patch notes ad hoc.
4. **Spec changes bump the version** in this file's title and must stay readable by
   existing consumers (additive only within v1).
