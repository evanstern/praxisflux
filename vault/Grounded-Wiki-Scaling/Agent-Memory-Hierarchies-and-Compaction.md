---
title: Agent Memory Hierarchies and Compaction
aliases: [MemGPT, Letta, memory paging]
tags: [memory, compaction, tokens]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]", "[[Progressive-Disclosure-and-Context-Engineering]]"]
---

# Agent Memory Hierarchies and Compaction

The MemGPT → Letta lineage treats the context window as **RAM in a virtual-memory system** and
manages a growing knowledge store the way an OS manages memory ([[_grounding]] §4).

## The tier model

| Tier | Analog | Contents | Cost |
|---|---|---|---|
| Core memory | RAM | small in-context blocks, always loaded | paid every turn |
| Recall memory | fast disk | searchable history/summaries | paid on search+load |
| Archival memory | slow disk | vector-indexed knowledge | paid on retrieval |

The agent itself **pages** data between tiers — promoting what's needed into core memory,
demoting what isn't — "creating an illusion of unlimited memory while working within fixed
context limits" ([Letta](https://www.letta.com/blog/agent-memory/)).

## Compaction

Older raw material is compressed into **episodic summaries**, the summaries committed to the
searchable tier, and the raw tokens evicted from the active window. The original detail remains
retrievable; only its resident-in-context form shrinks ([[_grounding]] §4).

## Relevance to a growing wiki

The tier model is the same decomposition as [[Progressive-Disclosure-and-Context-Engineering]]
seen from the storage side: what a wiki keeps "resident" (index/summaries) versus "paged in"
(full notes) versus "archived" (raw grounding detail, history). Compaction's key property —
**detail is demoted, not deleted** — is what lets the resident layer stay flat while the corpus
grows.

## Grounding

- [[_grounding]] §4 — memory hierarchies
- [Letta — Agent memory](https://www.letta.com/blog/agent-memory/)
- [Mastra — Agent memory: types, techniques](https://mastra.ai/articles/agent-memory)
