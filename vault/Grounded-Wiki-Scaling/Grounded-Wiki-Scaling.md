---
title: Grounded-Wiki-Scaling
aliases: [wiki token economy, wiki growth]
tags: [wiki, tokens, context-engineering]
type: moc
created: 2026-07-25
updated: 2026-07-25
related: []
---

# Grounded-Wiki-Scaling

How code-grounded wikis and documentation corpora manage growth as their project grows — the
known strategies for keeping LLM context cost bounded (tiered indexes, summary pyramids, memory
hierarchies, chunking, compression) and for keeping a larger corpus fresh. Gathered because the
praxisflux grounding wiki (`docs/wiki/`, 26 notes ≈ 34k tokens) is approaching the point where
loading "a few dozen pages" means loading everything.

## Scope

**In:** context-engineering principles; tiered/progressive-disclosure loading in shipped agent
systems (Skills, CLAUDE.md, llms.txt); hierarchical summarization (RAPTOR, GraphRAG); agent
memory paging and compaction (MemGPT/Letta); chunking and prompt compression; Wikipedia's
summary-style precedent; freshness/incremental regeneration for generated wikis.
**Out:** picking a strategy for praxisflux (that's an analysis), vector-database vendor
comparisons, general RAG evaluation.

## What is known

- The problem is an **attention budget**, not just a cost budget: over-loading degrades answers
  (context rot); progressive disclosure improves quality *and* cost —
  [[Progressive-Disclosure-and-Context-Engineering]].
- Shipped agent systems converge on **one-line index tiers routing to small on-demand documents**
  (Skills' ~100-token metadata level, llms.txt, lean CLAUDE.md with pointers) —
  [[Tiered-Entry-Points-and-Index-Files]].
- **Multi-level summary pyramids** make whole-corpus questions affordable: GraphRAG's root
  summaries used 97% fewer tokens than source text; tiers can be pre-built or lazy —
  [[Hierarchical-Summarization-Architectures]].
- Memory systems show the same shape as **paging + compaction**: detail is demoted to retrievable
  storage, never inflating the resident layer — [[Agent-Memory-Hierarchies-and-Compaction]].
- Two orthogonal cost levers compose with any structure: **heading-level chunking** (load a
  section, not a page) and **prompt compression** (5–20× on retrieved context, <2% quality drop) —
  [[Retrieval-Chunking-and-Compression]].
- Wikipedia solved the human version with **summary style**: split at ~10k words, parent keeps a
  summary + link per child, never split below minimum content — page cost stays bounded as the
  wiki grows by depth — [[Wikipedia-Summary-Style-Precedent]].
- Growth's second cost is truth: generated wikis stay viable via **incremental update pipelines**
  (AST diff → impact propagation → selective regeneration → validation) and drift detection tied
  to code-change events; every summary tier added is itself a surface that can drift —
  [[Freshness-and-Incremental-Regeneration]].

## Notes

- [[Brief-and-Assumptions]] — the request, measured current state of `docs/wiki/`, assumptions
- [[Progressive-Disclosure-and-Context-Engineering]] — attention budget, context rot, just-in-time loading
- [[Tiered-Entry-Points-and-Index-Files]] — Skills' three levels, llms.txt, lean-CLAUDE.md pointer pattern
- [[Hierarchical-Summarization-Architectures]] — RAPTOR trees, GraphRAG community summaries, lazy tiers
- [[Agent-Memory-Hierarchies-and-Compaction]] — MemGPT/Letta paging, compaction (demote, don't delete)
- [[Retrieval-Chunking-and-Compression]] — heading-based chunking, LLMLingua-family compression
- [[Wikipedia-Summary-Style-Precedent]] — summary style, size thresholds, split discipline
- [[Freshness-and-Incremental-Regeneration]] — DeepWiki/CodeWiki scale, RepoDoc incremental updates, drift

## Analyses

- [[Analysis-Token-Economy-for-the-Grounding-Wiki]] — how `docs/wiki/` should evolve to keep
  per-session token cost flat as the corpus grows

## Open questions

- What token budget per praxisflux session/subagent is acceptable? (No target stated.)
- Does retrieval-style selective loading count as "loading the wiki," or must each note get cheaper?
- Do subagent consumers (sweep, reorient) warrant different budgets than interactive sessions?
- Are there published measurements of summary-tier drift rates in maintained corpora? (Not found
  in this pass.)

## Grounding

- [[_grounding]] — the research pass this branch is built on (12-search web fan-out, 2026-07-25)
- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [arXiv 2404.16130 — GraphRAG](https://arxiv.org/pdf/2404.16130)
- [Wikipedia:Summary style](https://en.wikipedia.org/wiki/Wikipedia:Summary_style)
