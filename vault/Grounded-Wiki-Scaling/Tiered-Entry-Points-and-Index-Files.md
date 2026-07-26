---
title: Tiered Entry Points and Index Files
aliases: [llms.txt, skill metadata, pointer files]
tags: [indexes, tiering, tokens]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]", "[[Progressive-Disclosure-and-Context-Engineering]]", "[[Hierarchical-Summarization-Architectures]]"]
---

# Tiered Entry Points and Index Files

Three shipped systems solve corpus growth the same way: a **cheap, always-loadable index tier**
whose entries are one-liners, with full content loaded per-entry only on demand. The corpus can
grow arbitrarily; the always-loaded tier grows only by one line per unit.

## Claude Code Skills — three levels

- **Level 1 (metadata):** name + description of every skill, ~100 tokens each, always loaded.
- **Level 2 (body):** full SKILL.md loads only when the request matches the description.
- **Level 3 (resources):** bundled references/scripts read only when actually needed.

Reported effect: idle skills cost ~100 tokens; 30+ installed skills "run without context issues"
([[_grounding]] §2; [Claude docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview.md)).
The load-bearing design detail is that the Level-1 description is written **for routing** — it
exists to let the model decide whether to load Level 2, not to summarize all content.

## llms.txt — a curated Markdown map

A root-level index of links with one-line descriptions, optimized for LLM consumption; adopted by
Anthropic, Cloudflare, Perplexity, and many doc platforms. Described as turning "a chaotic website
into a token-efficient knowledge base." Sites often pair it with per-page `.md` twins and an
`llms-full.txt` full-corpus concatenation for consumers that do want everything
([[_grounding]] §2; [Mintlify](https://www.mintlify.com/blog/what-is-llms-txt),
[Ahrefs](https://ahrefs.com/blog/what-is-llms-txt/)). One cited measurement: Markdown-formatted
content improved model accuracy >7% while cutting tokens ~30% vs HTML ([[_grounding]] §2).

## CLAUDE.md / AGENTS.md — small root, pointers down

Practitioner consensus for always-on memory files ([[_grounding]] §2):

- Keep under ~200 lines; the file is paid for on **every turn** (2k tokens × 30 messages ≈ 60k).
- Top: 10–20 lines of non-negotiables. Below: pointers (`@includes`, file paths) to narrowly
  scoped docs — "not the deep docs themselves."
- Corollary for the linked docs: "keep individual docs small and linked to each other. That way
  only the relevant doc gets pulled into context, not the whole thing."

## The common shape

All three converge on: **(1)** an index whose per-entry cost is a single high-signal line,
**(2)** per-unit documents small enough that loading one is cheap, **(3)** routing done by the
model reading the index, not by an external retrieval system. This is the non-embedding,
non-infrastructure end of the design space; [[Hierarchical-Summarization-Architectures]] covers
the retrieval-infrastructure end.

## Grounding

- [[_grounding]] §2 — tiered-loading systems
- [Claude docs — Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview.md)
- [Mintlify — What is llms.txt?](https://www.mintlify.com/blog/what-is-llms-txt)
- [maketocreate — CLAUDE.md best practices 2026](https://maketocreate.com/claude-md-best-practices-the-complete-2026-guide/)
