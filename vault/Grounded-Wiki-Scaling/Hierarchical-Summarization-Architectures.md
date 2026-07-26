---
title: Hierarchical Summarization Architectures
aliases: [RAPTOR, GraphRAG, summary trees]
tags: [summarization, retrieval, hierarchy]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]", "[[Tiered-Entry-Points-and-Index-Files]]", "[[Retrieval-Chunking-and-Compression]]"]
---

# Hierarchical Summarization Architectures

Where index files give one summary tier, these systems build a **pyramid of summaries at multiple
coarseness levels**, so a consumer can answer broad questions from cheap top-level summaries and
drill into raw detail only where needed.

## RAPTOR — recursive summary trees

Bottom-up construction: embed leaf chunks → cluster (GMM) → summarize each cluster into a parent
node → recurse to the root. "Lower levels retain fine-grained information and upper levels provide
increasingly abstract summaries." Retrieval hits **any level of the tree**, so one corpus serves
both detail queries and thematic queries. With GPT-4 it improved QuALITY benchmark accuracy by
20 points absolute ([[_grounding]] §3;
[RAPTOR explainer](https://dev.to/praveensk/-understanding-raptor-a-powerful-architecture-for-hierarchical-retrieval-in-rag-systems-5e5n)).

## GraphRAG — community summaries at graded coarseness

Microsoft GraphRAG extracts an entity graph, runs hierarchical (Leiden) community detection, and
**pre-generates a summary per community** at each hierarchy level (C0–C3). Documented numbers
([[_grounding]] §3; [arXiv 2404.16130](https://arxiv.org/pdf/2404.16130)):

- Root-level community summaries answered global corpus questions with **97% fewer tokens** than
  processing source text, at competitive quality.
- Consumers explicitly trade response depth for token cost by choosing a level.
- Two query modes: **global** (holistic questions over community summaries) and **local**
  (fan out from a specific entity to its neighbors) — different questions load different tiers.
- **LazyGraphRAG** moves summarization to query time, cutting indexing cost — evidence that the
  pyramid can be built lazily rather than maintained eagerly
  ([Microsoft Research](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)).

## What the pattern establishes

1. Multi-level summaries are the known mechanism for keeping "answer a question about the whole
   corpus" affordable as the corpus grows — the top tier's size grows sublinearly.
2. The tiers can be **pre-computed** (GraphRAG classic, RAPTOR) or **computed on demand**
   (LazyGraphRAG); both are viable, trading index maintenance cost against query latency/cost.
3. Query routing (which tier to read) is a first-class design decision: global-vs-local search in
   GraphRAG, tree-level selection in RAPTOR.

## Grounding

- [[_grounding]] §3 — hierarchical summarization
- [arXiv 2404.16130 — GraphRAG](https://arxiv.org/pdf/2404.16130)
- [Microsoft Research — LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)
