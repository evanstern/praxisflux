---
title: Brief and Assumptions
aliases: []
tags: [brief]
type: note
created: 2026-07-25
updated: 2026-07-25
related: ["[[Grounded-Wiki-Scaling]]"]
---

# Brief and Assumptions

## The request (restated)

> The current grounding wiki pages are very useful. But, given their size, they can become too
> much to load into context (even if we only load a few dozen pages, it adds up). We need to
> think of ways to minimize token usage when loading wiki pages.
>
> How do grounded wikis like ours manage to grow over time as a project grows in size and scope?

## Current state (measured 2026-07-25)

- The praxisflux grounding wiki lives at `docs/wiki/`: **26 Markdown notes, ~137 KB total**
  (~34k tokens at ~4 bytes/token), plus `INDEX.md` as the entry point.
- Note sizes: mean ~5.3 KB (~1.3k tokens); largest `build-and-release.md` at 12.7 KB (~3k
  tokens); the top eight notes are all ≥5.8 KB.
- `INDEX.md` is already a **one-line-per-note routing index** (grouped System / Chassis /
  Plugins / Repo operations), ~1.5k tokens total.
- Note frontmatter already carries `name`, `description`, `kind`, `sources`, and
  `verified_against`. Some `description:` fields have grown to full paragraphs (e.g.
  `pdlc-plugin.md`'s is ~90 words), duplicating body content.
- Notes are per-concept, pinned to a commit (`verified_against`), interlinked, and gated for
  freshness (`grounding-wiki` plugin). Loading "a few dozen pages" therefore approaches the
  entire corpus — tens of thousands of tokens per session.
- The wiki is regenerated/re-verified via `/grounding-wiki:wiki-update`; consumers include the
  repo's own sessions, sweep orchestration, reorient evaluators, and CI-adjacent gates.

## Assumptions

- "Loading" means placing note bodies into an LLM context window (Claude Code sessions and
  subagents), not human reading.
- The concern is **growth-proportional cost**: the corpus scales with the codebase, so any
  strategy must hold per-session token cost roughly flat while the corpus grows.
- Structural changes to the wiki format are on the table (the corpus spec is ours to evolve),
  but grounding guarantees (commit pinning, freshness gates) must survive any change.
- This branch gathers **what is known** about how such systems handle growth; picking a strategy
  for praxisflux is a later analysis, not part of this research.

## Open questions (flagged for the analysis phase)

- What token budget per session is acceptable? (No target was stated.)
- Should retrieval-style selective loading count as "loading the wiki", or is the goal to make
  every note individually cheaper?
- Do subagent consumers (sweep, reorient) have different budgets than interactive sessions?
