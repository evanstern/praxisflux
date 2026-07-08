---
name: <kebab-case, matches filename>
description: <one line — used to decide relevance during recall>
kind: component | concept | pipeline | pattern
sources:
  - <repo-relative path whose change invalidates this note>
verified_against: <full commit hash>
---

# <Title>

<What it is and why it exists — 2-4 sentences, neutral and factual.>

## How it works

<Grounded specifics: symbols, defaults, algorithms. Short verbatim snippets only where
load-bearing. File paths + symbol names, never line numbers.>

## Connections

<[[other-note]] links: what feeds this, what this feeds.>

## Operational notes

<Env vars, defaults, failure behavior, metrics.>
