---
title: Grounded-Wiki-Scaling — Grounding
aliases: []
tags: [grounding]
type: source
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]"]
---

# Grounded-Wiki-Scaling — Grounding

> Source-of-truth artifact. This is the raw, cited output of a research pass (the `deep-research`
> skill, or a direct web-search fan-out). Keep it close to verbatim — do not editorialize, prune,
> or draw conclusions here. Knowledge notes and analyses cite *into* this file.

**Research question:** How do code-grounded wikis / documentation corpora manage growth over time
as a project grows in size and scope — specifically, strategies for minimizing token usage when
loading wiki pages into LLM context (summarization layers, progressive disclosure, indexes,
retrieval, chunking, tiered detail, compaction)?
**Method:** web-search fan-out (12 parallel searches across distinct angles) · 2026-07-25

---

## 1. Context engineering: the attention-budget framing

Anthropic's engineering guidance frames the problem as curating what enters the model's **limited
attention budget** at each step, rather than minimizing prompt length per se. Key claims
([Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)):

- Guiding principle: "find the smallest set of high-signal tokens that maximize the likelihood of
  your desired outcome."
- Large contexts cause **context rot**: attention dilutes across too much material; performance on
  tasks referencing the middle of very large contexts degrades ("lost in the middle").
- **Progressive disclosure**: letting agents navigate and retrieve data autonomously lets them
  incrementally discover relevant context through exploration; this "improves both quality and
  cost-efficiency regardless of the underlying model's context capacity."
- **Just-in-time context**: rather than pre-loading, agents fetch content when a task needs it.
- Claude Code itself is cited as a **hybrid model**: `CLAUDE.md` files are "naively dropped into
  context up front, while primitives like glob and grep allow it to navigate its environment and
  retrieve files just-in-time."
- Compaction (summarize-and-evict) is listed alongside token-efficient tools and just-in-time
  exploration as the standard levers for long-horizon work.

## 2. Tiered loading in shipped agent systems

### Claude Code Skills — three-level progressive disclosure

The Agent Skills format is an existing, shipped example of a corpus that scales by tiering
([Claude docs — Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview.md),
[DesignRevision guide](https://designrevision.com/blog/claude-code-skills),
[HatchWorks — Skills architecture](https://hatchworks.com/blog/claude/skills-architecture/)):

- **Level 1 — metadata**: only name + description of every installed skill loads at startup
  (~100 tokens per skill; "a line or two per skill").
- **Level 2 — instructions**: the full SKILL.md body loads only when the request matches the
  description.
- **Level 3+ — resources**: bundled reference files/scripts are read or run only when needed.
- Reported consequence: idle skills cost ~100 tokens each; "power-user setups with 30+ skills run
  without context issues."

### CLAUDE.md / AGENTS.md — small root + pointers

Practitioner guidance converges on keeping always-loaded memory files small and pushing detail
into linked docs
([maketocreate — CLAUDE.md best practices 2026](https://maketocreate.com/claude-md-best-practices-the-complete-2026-guide/),
[MindStudio — managing Claude Code token usage](https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage),
[dev.to — Token Optimisation 101](https://dev.to/stevengonsalvez/token-optimisation-101-stop-burning-money-on-ai-coding-agents-4mce)):

- Keep CLAUDE.md "under ~200 lines"; it "loads into every single conversation" so every line costs
  tokens on every turn (a 2,000-token CLAUDE.md over 30 messages ≈ 60k tokens on system prompt).
- Structure: 10–20 lines of non-negotiables at top (commands, invariants), then **pointers**
  (`@includes` / file paths) to narrowly scoped docs (architecture, testing strategy, glossary) —
  "not the deep docs themselves."
- "Build small, focused docs. Instead of one giant reference document, keep individual docs small
  and linked to each other. That way only the relevant doc gets pulled into context."

### llms.txt — a curated, token-efficient entry index

The llms.txt convention (proposed Sept 2024 by Jeremy Howard; adopted by Anthropic, Cloudflare,
Perplexity, many dev-tool vendors) gives LLMs "a clear, curated map of the most important content"
as a Markdown index at a site root
([Mintlify — what is llms.txt](https://www.mintlify.com/blog/what-is-llms-txt),
[Ahrefs — What is llms.txt](https://ahrefs.com/blog/what-is-llms-txt/),
[websiteaiscore — llms.txt/markdown sitemap guide](https://websiteaiscore.com/blog/llms-txt-markdown-sitemap-guide)):

- The file is an index of links with one-line descriptions — an "active entry point that turns a
  chaotic website into a token-efficient knowledge base."
- One cited claim: optimizing data formats (Markdown vs HTML) "can improve model accuracy by over
  7% while reducing token usage by nearly 30%."
- Common companion: per-page `.md` twins and an `llms-full.txt` (full corpus concatenation) for
  consumers that want everything.

## 3. Hierarchical summarization architectures

### RAPTOR — recursive summary trees

RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval) builds a bottom-up tree:
leaf chunks are embedded, clustered (GMM), each cluster summarized into a higher-level node,
recursively, so "lower levels retain fine-grained information and upper levels provide increasingly
abstract summaries." Retrieval can hit **any level** of the tree, serving detail or theme as the
query requires. Coupled with GPT-4 it improved best-known QuALITY benchmark accuracy by 20%
absolute
([dev.to — Understanding RAPTOR](https://dev.to/praveensk/-understanding-raptor-a-powerful-architecture-for-hierarchical-retrieval-in-rag-systems-5e5n),
[machinelearningplus — RAPTOR RAG explained](https://machinelearningplus.com/gen-ai/raptor-rag-explained-building-hierarchical-retrieval-for-smarter-ai-answers/),
[RAGFlow docs — Enable RAPTOR](https://ragflow.io/docs/enable_raptor)).

### GraphRAG — community summaries at graded coarseness

Microsoft GraphRAG builds an entity knowledge graph, then **pre-generates community summaries**
for clusters of related entities via hierarchical (Leiden) community detection
([Microsoft Research — From Local to Global](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/),
[arXiv 2404.16130](https://arxiv.org/pdf/2404.16130),
[Microsoft Research — dynamic community selection](https://www.microsoft.com/en-us/research/blog/graphrag-improving-global-search-via-dynamic-community-selection/)):

- The community hierarchy gives coarseness levels (C0–C3); users "trade response depth for token
  cost — root-level summaries required **97% fewer tokens** than processing source text directly."
- Two query modes: **global search** (answer holistic questions from community summaries) and
  **local search** (fan out from specific entities to neighbors).
- Root-level community summaries "achieve competitive performance to other global methods at a
  fraction of the token cost."
- **LazyGraphRAG** defers nearly all summarization to query time, cutting indexing cost while
  keeping quality ([Microsoft Research — LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)).

## 4. Agent memory hierarchies: paging and compaction

MemGPT introduced the OS-paging metaphor for LLM context; Letta is its production successor
([Letta — Agent Memory](https://www.letta.com/blog/agent-memory/),
[Mastra — Agent memory: types, techniques](https://mastra.ai/articles/agent-memory),
[MEMTIER, arXiv 2605.03675](https://arxiv.org/pdf/2605.03675)):

- Tiers: **core memory** (in-context blocks) ≈ RAM; **recall memory** (searchable history) ≈ fast
  disk; **archival memory** (vector-indexed knowledge) ≈ slow disk.
- The agent itself moves data between tiers ("paging"), creating "an illusion of unlimited memory
  while working within fixed context limits."
- **Compaction**: older message blocks are compressed into episodic summaries, committed to recall
  memory, and the raw tokens evicted from the active window.

## 5. Retrieval, chunking, and compression mechanics

### Chunking practice for Markdown corpora

2026 practitioner consensus for RAG over structured docs
([Firecrawl — Best chunking strategies](https://www.firecrawl.dev/blog/best-chunking-strategies-rag),
[bytetools — RAG chunking guide](https://bytetools.io/guides/rag-chunking-strategies),
[langcopilot — document chunking practical guide](https://langcopilot.com/posts/2025-10-11-document-chunking-for-rag-practical-guide)):

- For content with clear structure (Markdown/HTML), **structure-aware splitting on headings**
  (e.g. `MarkdownHeaderTextSplitter`) is "often the single biggest and easiest improvement";
  for code, split per function/class via AST.
- Semantic chunking adds ~9% recall over simple methods but costs embedding every sentence; add it
  only after measuring a retrieval-quality gap.
- Tag chunks with metadata (section headers, doc type) for retrieval signals beyond similarity.

### Prompt/context compression

LLMLingua-family results
([Microsoft Research — LLMLingua](https://www.microsoft.com/en-us/research/blog/llmlingua-innovating-llm-efficiency-with-prompt-compression/),
[LLMLingua-2, arXiv 2403.12968](https://arxiv.org/pdf/2403.12968),
[LongLLMLingua, arXiv 2310.06839](https://arxiv.org/pdf/2310.06839),
[PromptHub — compressing prompts with LLMLingua](https://www.prompthub.us/blog/compressing-prompts-with-llmlingua-reduce-costs-retain-performance)):

- 2–5× compression on instruction prompts, 5–20× on RAG context, with under ~2% quality drop on
  CoQA/HotpotQA/TriviaQA; up to 20× in the best case.
- Method: small LM scores per-token perplexity; low-information tokens are dropped
  (coarse-to-fine, budget-controlled). LLMLingua-2 recasts compression as token classification
  via data distillation for task-agnostic faithfulness.

## 6. Precedent from human wikis: Wikipedia summary style

Wikipedia's editorial guidelines are the longest-running precedent for a wiki that grows without
individual pages becoming unreadable
([Wikipedia:Summary style](https://en.wikipedia.org/wiki/Wikipedia:Summary_style),
[Wikipedia:Article size](https://en.wikipedia.org/wiki/Wikipedia:Article_size),
[Wikipedia:Splitting](https://en.wikipedia.org/wiki/Wikipedia:Splitting)):

- **Summary style**: a parent article keeps a summary of each subtopic and links to a dedicated
  child article for detail — "summarizing main points and going into more details on particular
  points (subtopics) in separate articles."
- **Size trigger**: at ~10,000 words, moving sections out into child articles is recommended.
- Splits are driven by two reasons: size and content relevance (out-of-scope material).
- Counter-rule: don't split if the child "would simply duplicate the summary that would be left
  behind" — i.e., splitting has a minimum-content threshold.

## 7. Auto-generated codebase wikis at scale, and staying fresh

### DeepWiki / CodeWiki

DeepWiki (Cognition) auto-generates wiki documentation per repository; it has "processed over
4 billion lines of code and indexed more than 30,000 repositories" (50k+ popular public repos by
2026). Architecture: code parsing engine → dynamic Markdown document generation → conversational
AI layer over the index
([Devin docs — DeepWiki](https://docs.devin.ai/work-with-devin/deepwiki),
[codersera — DeepWiki guide](https://codersera.com/blog/how-to-use-deepwiki-understand-large-codebases-faster)).
The CodeWiki paper benchmarks holistic wiki generation for large-scale codebases and finds
behavior patterns consistent across repo sizes within language families
([CodeWiki, arXiv 2510.24428](https://arxiv.org/pdf/2510.24428)).

### Incremental regeneration and drift detection

RepoDoc (knowledge-graph-based doc generation) describes a four-stage **incremental update**
mechanism: change detection (AST diff, classify change types) → semantic impact propagation
(which components are affected) → **selective regeneration** (update only affected docs, preserve
the rest) → validation (cross-reference consistency)
([RepoDoc, arXiv 2604.26523](https://arxiv.org/html/2604.26523v1)).
The "continuous documentation" pattern runs agents on push/schedule to detect code–doc drift and
open reviewable PRs realigning docs; the fix for drift is "to tie doc updates to the events that
change code, so the docs regenerate on the same trigger that produced the change"
([AgentPatterns — Continuous Documentation](https://www.agentpatterns.ai/workflows/continuous-documentation/),
[Dosu — AI-maintained documentation](https://dosu.dev/blog/using-ai-to-generate-and-maintain-documentation)).

---

## Sources

1. [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
2. [MindStudio — Progressive disclosure in AI agents](https://www.mindstudio.ai/blog/progressive-disclosure-ai-agents-context-management)
3. [Claude docs — Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview.md)
4. [DesignRevision — Claude Code Skills: the complete guide (2026)](https://designrevision.com/blog/claude-code-skills)
5. [HatchWorks — Claude Skills architecture](https://hatchworks.com/blog/claude/skills-architecture/)
6. [maketocreate — CLAUDE.md best practices: the complete 2026 guide](https://maketocreate.com/claude-md-best-practices-the-complete-2026-guide/)
7. [MindStudio — How to manage Claude Code token usage](https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage)
8. [dev.to — Token Optimisation 101](https://dev.to/stevengonsalvez/token-optimisation-101-stop-burning-money-on-ai-coding-agents-4mce)
9. [Mintlify — What is llms.txt?](https://www.mintlify.com/blog/what-is-llms-txt)
10. [Ahrefs — What is llms.txt, and should you care?](https://ahrefs.com/blog/what-is-llms-txt/)
11. [websiteaiscore — llms.txt / Markdown sitemap guide](https://websiteaiscore.com/blog/llms-txt-markdown-sitemap-guide)
12. [dev.to — Understanding RAPTOR](https://dev.to/praveensk/-understanding-raptor-a-powerful-architecture-for-hierarchical-retrieval-in-rag-systems-5e5n)
13. [machinelearningplus — RAPTOR RAG explained](https://machinelearningplus.com/gen-ai/raptor-rag-explained-building-hierarchical-retrieval-for-smarter-ai-answers/)
14. [RAGFlow docs — Enable RAPTOR](https://ragflow.io/docs/enable_raptor)
15. [Microsoft Research — From Local to Global: a Graph RAG approach](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/)
16. [arXiv 2404.16130 — GraphRAG paper](https://arxiv.org/pdf/2404.16130)
17. [Microsoft Research — GraphRAG dynamic community selection](https://www.microsoft.com/en-us/research/blog/graphrag-improving-global-search-via-dynamic-community-selection/)
18. [Microsoft Research — LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)
19. [Letta — Agent memory: how to build agents that learn and remember](https://www.letta.com/blog/agent-memory/)
20. [Mastra — Agent memory: types, techniques, implementation](https://mastra.ai/articles/agent-memory)
21. [arXiv 2605.03675 — MEMTIER: tiered memory for long-running agents](https://arxiv.org/pdf/2605.03675)
22. [Firecrawl — Best chunking strategies for RAG (2026)](https://www.firecrawl.dev/blog/best-chunking-strategies-rag)
23. [bytetools — RAG chunking: fixed vs semantic vs recursive](https://bytetools.io/guides/rag-chunking-strategies)
24. [langcopilot — Document chunking for RAG: practical guide](https://langcopilot.com/posts/2025-10-11-document-chunking-for-rag-practical-guide)
25. [Microsoft Research — LLMLingua](https://www.microsoft.com/en-us/research/blog/llmlingua-innovating-llm-efficiency-with-prompt-compression/)
26. [arXiv 2403.12968 — LLMLingua-2](https://arxiv.org/pdf/2403.12968)
27. [arXiv 2310.06839 — LongLLMLingua](https://arxiv.org/pdf/2310.06839)
28. [PromptHub — Compressing prompts with LLMLingua](https://www.prompthub.us/blog/compressing-prompts-with-llmlingua-reduce-costs-retain-performance)
29. [Wikipedia:Summary style](https://en.wikipedia.org/wiki/Wikipedia:Summary_style)
30. [Wikipedia:Article size](https://en.wikipedia.org/wiki/Wikipedia:Article_size)
31. [Wikipedia:Splitting](https://en.wikipedia.org/wiki/Wikipedia:Splitting)
32. [Devin docs — DeepWiki](https://docs.devin.ai/work-with-devin/deepwiki)
33. [codersera — How to use DeepWiki](https://codersera.com/blog/how-to-use-deepwiki-understand-large-codebases-faster)
34. [arXiv 2510.24428 — CodeWiki](https://arxiv.org/pdf/2510.24428)
35. [arXiv 2604.26523 — RepoDoc: incremental doc updates](https://arxiv.org/html/2604.26523v1)
36. [AgentPatterns — Continuous documentation](https://www.agentpatterns.ai/workflows/continuous-documentation/)
37. [Dosu — Using AI to generate and maintain documentation](https://dosu.dev/blog/using-ai-to-generate-and-maintain-documentation)
