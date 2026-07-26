---
title: Freshness and Incremental Regeneration
aliases: [doc drift, incremental updates]
tags: [freshness, maintenance, generated-docs]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]", "[[Wikipedia-Summary-Style-Precedent]]"]
---

# Freshness and Incremental Regeneration

Growth has a second cost besides loading: **keeping a larger corpus true**. What is known about
how auto-generated codebase wikis handle scale and drift ([[_grounding]] §7).

## Generated wikis at scale

DeepWiki (Cognition) generates wiki documentation per repository and has indexed 30,000+ repos /
4B+ lines of code, via a parse → generate-Markdown → conversational-layer architecture. The
CodeWiki benchmark study found generation behavior consistent across repository sizes within
language families — i.e., per-repo wiki generation itself scales; the open problem is upkeep
([[_grounding]] §7; [Devin docs](https://docs.devin.ai/work-with-devin/deepwiki),
[arXiv 2510.24428](https://arxiv.org/pdf/2510.24428)).

## Incremental update, not regeneration

RepoDoc documents a four-stage incremental mechanism that takes existing docs + a commit diff and
touches only what changed ([arXiv 2604.26523](https://arxiv.org/html/2604.26523v1)):

1. **Change detection** — AST-level diff, classify change types;
2. **Semantic impact propagation** — determine which documented components are affected;
3. **Selective regeneration** — rewrite only affected docs, preserve the rest;
4. **Validation** — cross-reference consistency check.

## Drift detection as a pipeline event

The "continuous documentation" pattern ties doc updates to the events that change code: agents run
on push/schedule, detect code–doc drift, and open reviewable PRs realigning docs — "the docs
regenerate on the same trigger that produced the change"
([AgentPatterns](https://www.agentpatterns.ai/workflows/continuous-documentation/),
[Dosu](https://dosu.dev/blog/using-ai-to-generate-and-maintain-documentation)).

## Interaction with summary layers

Any added summary tier (index descriptions, rollups, community-style summaries) is itself a
documentation surface that can drift — each tier needs to be covered by the same
change-detection → selective-regeneration loop, or it silently decays into the very problem
summary tiers exist to solve. The incremental-update stages above are the documented mechanism
for keeping multi-tier corpora consistent at bounded per-change cost ([[_grounding]] §7).

## Grounding

- [[_grounding]] §7 — generated wikis and drift
- [arXiv 2604.26523 — RepoDoc](https://arxiv.org/html/2604.26523v1)
- [AgentPatterns — Continuous documentation](https://www.agentpatterns.ai/workflows/continuous-documentation/)
