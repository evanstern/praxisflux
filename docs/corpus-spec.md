# The grounded corpus — praxisflux's interchange contract (spec v2)

A **grounded corpus** is a directory of interlinked Markdown notes that praxisflux tools
produce and consume. It is the *only* way praxisflux tools compose around knowledge: producers
write the format, consumers read it, and **no tool ever invokes another**. Anything that can
write this format participates in the ecosystem; anything that can read it benefits from
every producer.

**v2 additions** — v1 defined structure and provenance; v2 adds the token economy. Every
v1 corpus remains readable; the new artifacts are optional for readers, and the new
budgets bind producers at write/update time:

- a **consumption protocol** — how consumers load a corpus (index-first, just-in-time);
- a **capsule tier** — capped `description:` capsules and a generated `CAPSULES.md`;
- a **note size budget** with summary-style split discipline;
- **section addressability** — `##` sections are the sub-note addressable unit.

Known producers: `research-vault` (web-grounded branches), `grounding-wiki` (code-grounded
wikis). Known consumers: `analyze-vault` (Q&A/synthesis), `vault-artifact` (render),
codebase-to-course (course briefs), educate (lesson grounding), build (SPEC citations).
External tools can ingest a corpus via a markdown parser and serve it over MCP.

## Corpus layout

```
<corpus-root>/
  INDEX.md          # required: one line per note — the recall surface
  CAPSULES.md       # optional, generated: the capsule rollup (see "The capsule tier")
  <name>.md         # one note per concept; filename = frontmatter name + .md
  ...
```

A corpus is recognized by an `INDEX.md` whose siblings are frontmattered notes. Producers
may add their own sentinel (research vaults use `.research-vault`); consumers must not
require one beyond `INDEX.md`.

## How consumers load a corpus

A corpus grows linearly with its subject; a session's cost must grow only with its task.
The default loading discipline for every consumer:

1. **`INDEX.md` first, always** — it is the routing surface.
2. **Notes just-in-time, individually** — route through the index (or the capsules, below)
   and load only the notes the task needs. Bulk-loading a corpus is never default behavior.
3. **Whole-corpus orientation reads `CAPSULES.md`**, not the note bodies. Tasks that
   genuinely need the whole corpus (evaluation, architecture orientation) take the capsule
   view; where a v1 corpus has no `CAPSULES.md`, fall back to `INDEX.md` plus just-in-time
   notes.
4. **Within a note, `##` sections are the addressable unit** — a consumer that needs one
   aspect of a large note reads that section, not the file.

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
  It is also the note's capsule and carries a budget (see "The capsule tier").
- Organize the body under `##` headings (a short preamble is allowed). A `##` section is the
  **sub-note addressable unit**: consumers may load one section alone, so each must stand on
  its own.

## The capsule tier and CAPSULES.md

Every note's `description:` is its **capsule**: at most 500 characters (~125 tokens),
written for routing — what the note covers and when to load it — never as a teaser.

`CAPSULES.md` is a **generated** corpus artifact beside `INDEX.md`: for each note, its
INDEX.md line followed by its capsule. It is the cheap whole-corpus view (~10× cheaper
than reading the note bodies at current corpus sizes) and is **optional for readers** —
consumers must not require it (guardrail: a v1 corpus without one stays valid).

`CAPSULES.md` is derived state. Producers regenerate it whenever any `description:`
changes; hand-editing it is an error. It carries a header naming its generator and the
corpus commit it was generated at (code dialect), so drift is detectable.

Capsules are drift surfaces. A note edit that changes what the note covers must update
its capsule in the same pass — the same re-verify discipline that governs pins.

## Note size budget and summary-style splits

A note body (everything below the frontmatter) must stay at or under **8,000 characters**
(~2k tokens). The budget binds producers at write/update time; readers never reject an
over-budget note.

At the cap, split **summary-style**: move subtopics into new child notes. The parent
keeps a one-paragraph summary of each child plus its `[[wikilink]]`; the child links back
to the parent; `INDEX.md` gains one line per child.

**Minimum-content counter-rule:** never split when the child would hold less than ~1,500
characters of substance, or would merely duplicate the summary left behind. An over-cap
parent with nothing splittable is acceptable — flag it, don't butcher it.

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
   existing consumers. v2 keeps that promise the same way: its artifacts (`CAPSULES.md`)
   are optional for readers, and its budgets (capsule, note size) bind producers at
   write/update time — a v1 corpus remains a valid corpus.
