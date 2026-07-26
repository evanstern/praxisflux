---
title: Retrieval, Chunking, and Compression
aliases: [chunking, LLMLingua, prompt compression]
tags: [retrieval, chunking, compression, tokens]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]", "[[Hierarchical-Summarization-Architectures]]"]
---

# Retrieval, Chunking, and Compression

Mechanics that reduce the tokens paid per load, independent of how the corpus is organized.

## Chunking Markdown corpora (sub-document granularity)

2026 practitioner consensus ([[_grounding]] §5):

- For structured content, **split on headings** (structure-aware, e.g. `MarkdownHeaderTextSplitter`)
  — "often the single biggest and easiest improvement." For code, split per function/class via AST.
- This makes the **section, not the page, the unit of loading**: a consumer can pull one `##`
  section of a note instead of the whole file.
- Semantic chunking adds ~9% recall but requires embedding every sentence; recommended only after
  measuring a retrieval-quality gap. Start structure-aware with modest overlap.
- Chunks carry metadata (section header, doc type) as retrieval signals beyond similarity.

## Prompt/context compression (LLMLingua family)

Documented results ([[_grounding]] §5;
[Microsoft Research](https://www.microsoft.com/en-us/research/blog/llmlingua-innovating-llm-efficiency-with-prompt-compression/)):

- 2–5× compression of instruction text and 5–20× of RAG context with <2% quality drop on standard
  QA benchmarks; up to 20× best case.
- Mechanism: a small LM scores per-token perplexity and drops low-information tokens under a
  budget controller; LLMLingua-2 recasts this as token classification (data distillation) for
  task-agnostic faithfulness; LongLLMLingua adds query-aware compression and reordering for long
  contexts.
- Compression is **lossy at the surface level but preserves task performance** — a different
  trade than summarization, which changes the text's identity.

## Where these sit in the design space

Chunking changes the **granularity of what can be loaded**; compression changes the **cost of
what is loaded**. Both compose with the organizational strategies (tiered indexes, summary
pyramids) rather than competing with them — e.g., GraphRAG's 97%-fewer-tokens figure comes from
organization, and compression could stack a further multiple on top ([[_grounding]] §3, §5).

## Grounding

- [[_grounding]] §5 — chunking and compression
- [Firecrawl — Best chunking strategies for RAG](https://www.firecrawl.dev/blog/best-chunking-strategies-rag)
- [arXiv 2403.12968 — LLMLingua-2](https://arxiv.org/pdf/2403.12968)
