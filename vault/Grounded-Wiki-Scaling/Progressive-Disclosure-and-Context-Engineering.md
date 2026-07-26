---
title: Progressive Disclosure and Context Engineering
aliases: [context engineering, progressive disclosure]
tags: [context-engineering, tokens]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]", "[[Tiered-Entry-Points-and-Index-Files]]", "[[Agent-Memory-Hierarchies-and-Compaction]]"]
---

# Progressive Disclosure and Context Engineering

The current framing of the token-budget problem, per Anthropic's engineering guidance: the model
has a limited **attention budget**, and the goal is "the smallest set of high-signal tokens that
maximize the likelihood of your desired outcome" — not shorter text for its own sake
([Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
[[_grounding]] §1).

## What is established

- **Context rot is real.** Beyond a point, adding material *degrades* answers: attention dilutes,
  and content in the middle of very large contexts is recalled worst ("lost in the middle").
  Loading a whole corpus is therefore a quality problem, not only a cost problem ([[_grounding]] §1).
- **Progressive disclosure beats pre-loading.** Letting the agent discover context incrementally
  (navigate, search, open what it needs) improves both quality and cost-efficiency regardless of
  the model's context capacity ([[_grounding]] §1).
- **Just-in-time retrieval is the complement**: content is fetched at the moment a task needs it
  rather than resident from turn one ([[_grounding]] §1).
- **Hybrid is the shipped pattern.** Claude Code drops small always-on files (CLAUDE.md) into
  context up front while everything else is reached just-in-time via glob/grep/read. The
  always-on layer is kept deliberately tiny; the corpus stays on disk ([[_grounding]] §1, §2).
- **Compaction** (summarize old material, evict the raw tokens) is the standard third lever for
  long-horizon sessions, alongside token-efficient tools and just-in-time exploration
  ([[_grounding]] §1, and its memory-system form in [[Agent-Memory-Hierarchies-and-Compaction]]).

## How this maps onto a wiki corpus

Under this framing, a grounded wiki's scaling question decomposes into: (a) what is *always*
loaded (should be an index-sized summary layer), (b) what is loaded *on demand* (individual
notes, ideally addressable at sub-note granularity), and (c) how the on-demand layer is found
(links, search, or an index). The systems in [[Tiered-Entry-Points-and-Index-Files]] and
[[Hierarchical-Summarization-Architectures]] are concrete instances of this decomposition.

## Grounding

- [[_grounding]] §1 — context engineering claims
- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
