---
title: Analysis — Token Economy for the Grounding Wiki
aliases: [wiki token economy analysis]
tags: [analysis]
type: analysis
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]"]
---

# Analysis — Token Economy for the Grounding Wiki

_How should the praxisflux grounding wiki (`docs/wiki/`) evolve so that per-session token cost
stays roughly flat while the corpus grows with the project?_

## Verdict

**Don't add retrieval infrastructure. Formalize the tier structure the wiki already half-has, and
change the consumption protocol.** Concretely, in priority order:

1. **Make the loading protocol the primary fix, not the format.** The default consumption rule —
   written into the corpus spec and every consumer's instructions — should be: *load `INDEX.md`
   always; load individual notes just-in-time by following the index; never bulk-load the wiki.*
   The corpus can then grow linearly while per-session cost grows only with the **task's**
   footprint, which is the property every system in the branch converges on
   ([[Progressive-Disclosure-and-Context-Engineering]], [[Tiered-Entry-Points-and-Index-Files]]).
2. **Add a capsule tier between the index line and the full note.** Give every note a bounded
   (~100–150 token) summary — the existing frontmatter `description:` field, capped and written
   for routing — and generate from it a `CAPSULES.md` rollup (index line + capsule per note,
   ~3–4k tokens for the whole corpus at today's size). That file becomes the cheap way to "read
   the whole wiki": a 10× cheaper whole-corpus view, the two-level pyramid GraphRAG shows pays
   for itself ([[Hierarchical-Summarization-Architectures]]).
3. **Adopt summary-style size discipline with an explicit threshold.** Cap notes at ~2k tokens
   (~8 KB). At the cap, split subtopics into child notes, leaving a summary + wikilink behind —
   and never split below minimum content ([[Wikipedia-Summary-Style-Precedent]]). Enforce the cap
   in the freshness/corpus gate so it's a property, not a habit.
4. **Make sections addressable.** Require `##` headings as the unit of content, so a consumer can
   read one section of a large note (offset/heading reads) instead of the file
   ([[Retrieval-Chunking-and-Compression]]).
5. **Pin the capsule tier like everything else.** Capsules and rollups are new drift surfaces;
   they must be covered by the same `sources`/`verified_against` machinery and re-verified in the
   same update pass, or they decay into the problem they solve
   ([[Freshness-and-Incremental-Regeneration]]).

Explicitly **rejected for now**: vector/embedding retrieval (RAPTOR/GraphRAG-style indexes) and
LLMLingua-style compression.

## Reasoning

**The consumption protocol dominates everything else.** The branch's strongest finding is that
over-loading is a *quality* problem, not just a cost problem — context rot degrades answers, and
progressive disclosure improves quality and cost together
([[Progressive-Disclosure-and-Context-Engineering]]). A format change that halves note size but
leaves consumers bulk-loading "a few dozen pages" saves 2× once; a protocol change bounds cost
*forever* — the corpus can double and a task that touches three concepts still loads three notes.
This is also the cheapest change: `docs/wiki/INDEX.md` is already a well-grouped one-line-per-note
routing index ([[Brief-and-Assumptions]]); what's missing is only the binding rule that consumers
route through it.

**Why a capsule tier anyway:** two praxisflux consumers legitimately need whole-corpus views —
reorient evaluators judging research against the project, and sweep sessions orienting on
architecture. For them "load everything" is the task, and today that costs ~34k tokens and rising
linearly. The branch shows the fix is a summary pyramid: GraphRAG's root-level summaries answered
corpus-wide questions at **97% fewer tokens** than source text
([[Hierarchical-Summarization-Architectures]]). At our scale one intermediate level suffices — a
~3–4k-token capsule rollup is the C1 tier; the full notes are the leaves. The Skills mechanism
proves the per-entry budget works: ~100 tokens of metadata per unit routes reliably
([[Tiered-Entry-Points-and-Index-Files]]). And the wiki already stores per-note `description:`
frontmatter — the tier exists structurally; it needs a token cap (some descriptions have grown to
~90-word paragraphs, [[Brief-and-Assumptions]]) and a generated rollup so it's loadable as one
cheap file.

**Why a size cap with split discipline:** growth otherwise concentrates in hot notes —
`build-and-release.md` is already 2.4× the mean ([[Brief-and-Assumptions]]). Wikipedia's precedent
is directly on point: absorb growth by **adding depth, not inflating pages**, with an explicit
threshold and a minimum-content counter-rule to prevent stub-splitting
([[Wikipedia-Summary-Style-Precedent]]). Praxisflux's own house rule — "status can't exceed proven
artifacts" — argues for putting the cap in the gate: like freshness, page-size economy should be
enforced, not aspirational.

**Why not embeddings/retrieval:** every retrieval architecture in the branch earns its keep on
corpora far larger than this one, and all add infrastructure with its own maintenance and drift.
At 26–100 notes, a model *reading a 1.5k-token index* is the routing mechanism — it's the shipped
pattern in Claude Code itself (small always-on layer + just-in-time file reads,
[[Progressive-Disclosure-and-Context-Engineering]]). The moment of reconsideration is when the
index itself stops fitting the routing budget (hundreds of notes) — and even then the branch
suggests laziness first (LazyGraphRAG defers summarization to query time rather than maintaining
eager indexes, [[Hierarchical-Summarization-Architectures]]).

**Why not compression:** LLMLingua's 5–20× gains are real but target machine-consumed retrieval
context ([[Retrieval-Chunking-and-Compression]]). This wiki is dual-audience — humans read it in
PRs and reviews, and its Markdown *is* the artifact the freshness gate pins. Compressing at load
time adds a moving part for a saving the capsule tier already delivers structurally.

## Tensions & tradeoffs

- **The capsule tier is a real maintenance tax.** Every note update now touches two surfaces
  (body + capsule), and capsule drift is subtle — it reads fine while quietly misrouting loads.
  Mitigation is mechanical coverage (same pins, same gate), but that's added gate complexity.
  [[Freshness-and-Incremental-Regeneration]] is blunt that every tier added is a drift surface.
- **Protocol fixes depend on compliance.** "Route through the index" is an instruction, not a
  gate — a sloppy consumer can still bulk-load. The structural changes (caps, capsules) are the
  hedge: they bound the damage when the protocol is ignored.
- **A 2k-token cap can fragment genuinely cohesive topics.** Wikipedia's counter-rule (don't
  split when the child would just duplicate the summary) must ship *with* the cap, or the gate
  will force stub notes that cost more hops than they save.
- **Maybe this is premature.** At 34k tokens, one could argue nothing needs to change until 2–3×
  growth. The counter: the protocol + capsule changes are cheapest to adopt while the corpus is
  small, and praxisflux's corpus spec is an interchange contract — changing it later means
  migrating every conforming corpus, not just this one.

## Confidence & open questions

**Confidence: high** on the ordering (protocol > capsules > caps > sections > pinning) and on
rejecting retrieval/compression at this scale — the branch's evidence is consistent across five
independent system families. **Medium** on the specific numbers (100–150-token capsules,
2k-token cap): those are calibrated from Skills' ~100-token metadata and Wikipedia's proportional
thresholds, not from praxisflux-specific measurement. Would change my mind:

- Measured routing failures — if consumers following capsule-level summaries pick wrong notes,
  the capsule budget is too tight.
- A stated per-session token budget (none exists — [[Brief-and-Assumptions]]) materially tighter
  or looser than assumed.
- Corpus growth past a few hundred notes, where the index itself outgrows its routing budget —
  that's the trigger to revisit lazy hierarchical summaries.
- Whether sweep/reorient subagents can be given the capsule rollup *instead of* note bodies
  without quality loss — worth an explicit A/B during the next reorient run.

## Basis

- [[_grounding]] — all external claims (context rot, tier economics, GraphRAG token figures,
  Wikipedia thresholds, compression ratios, drift mechanisms)
- [[Brief-and-Assumptions]] — measured current state of `docs/wiki/`
- [[Progressive-Disclosure-and-Context-Engineering]] — the attention-budget argument
- [[Tiered-Entry-Points-and-Index-Files]] — index-tier economics and shipped patterns
- [[Hierarchical-Summarization-Architectures]] — summary-pyramid token evidence
- [[Wikipedia-Summary-Style-Precedent]] — split thresholds and counter-rules
- [[Retrieval-Chunking-and-Compression]] — section-granularity and compression tradeoffs
- [[Agent-Memory-Hierarchies-and-Compaction]] — demote-don't-delete framing
- [[Freshness-and-Incremental-Regeneration]] — drift cost of added tiers
