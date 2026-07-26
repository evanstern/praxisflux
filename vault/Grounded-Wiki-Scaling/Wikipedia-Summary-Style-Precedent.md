---
title: Wikipedia Summary-Style Precedent
aliases: [summary style, article splitting]
tags: [wiki, precedent, structure]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]", "[[Tiered-Entry-Points-and-Index-Files]]"]
---

# Wikipedia Summary-Style Precedent

The longest-running precedent for a wiki that grows for decades without individual pages becoming
unreadable is Wikipedia's editorial policy, which solved the same shape of problem for human
attention budgets ([[_grounding]] §6).

## The rules

- **Summary style**: when a topic outgrows its article, subtopics move to dedicated child
  articles, and the parent keeps a **section-length summary of each child plus a link**. The
  parent stays a complete, readable overview; detail lives one hop away
  ([Wikipedia:Summary style](https://en.wikipedia.org/wiki/Wikipedia:Summary_style)).
- **Size trigger**: ~10,000 words is the documented threshold at which splitting sections out is
  recommended ([Wikipedia:Article size](https://en.wikipedia.org/wiki/Wikipedia:Article_size)).
- **Two split reasons**: size, and content relevance (material out of scope for the parent).
- **Minimum-content counter-rule**: don't split when the child article "would simply duplicate
  the summary that would be left behind" — premature splitting creates stubs and duplication
  ([Wikipedia:Splitting](https://en.wikipedia.org/wiki/Wikipedia:Splitting)).

## Structural consequences

Applied recursively, summary style produces exactly the multi-level summary pyramid that
[[Hierarchical-Summarization-Architectures]] builds computationally: every article is
simultaneously a leaf (its own detail) and a summary node (its summaries of children). Growth is
absorbed by **adding depth**, not by inflating any single page — so the cost of reading one page
stays bounded no matter how large the whole wiki becomes.

The policy also encodes maintenance discipline relevant to any grounded corpus: splits are
governed by explicit thresholds and justified reasons, not ad-hoc judgment, which is what keeps
page sizes bounded across thousands of independent editors.

## Grounding

- [[_grounding]] §6 — Wikipedia guidelines
- [Wikipedia:Summary style](https://en.wikipedia.org/wiki/Wikipedia:Summary_style)
- [Wikipedia:Article size](https://en.wikipedia.org/wiki/Wikipedia:Article_size)
