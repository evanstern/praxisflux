---
name: markdown-module
description: Chassis module lib/markdown.mjs — the minimal Markdown/YAML/wikilink parsing slice gates need: frontmatter, code stripping, wikilink extraction and resolution.
kind: component
sources:
  - lib/markdown.mjs
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# Markdown Module

`lib/markdown.mjs` is the small slice of Markdown/YAML/wikilink parsing that the plugins' gates
need to inspect vault and wiki notes. It was ported from the research gates' original Python
(`verify_branch`/`verify_analysis`) and is deliberately minimal rather than a full YAML or
Markdown parser: inline `key: value` frontmatter, inline `[a, b]` arrays, code-span stripping,
and Obsidian `[[wikilink]]` handling. Zero-dependency.

## How it works

Exports, with their parsing behavior and limits:

- `stripCode(text)` — removes fenced code blocks (` ``` … ``` `, non-greedy across lines) and
  inline code spans (`` `…` ``) so links inside code are ignored downstream. Null/undefined
  input is treated as `""`.

- `parseFrontmatter(text)` — parses a **leading** `---` YAML block into a flat object, or
  returns `null` if the file has no such block (the gates read `null` as "not a vault note").
  Details:
  - A BOM and leading whitespace are tolerated before the opening `---`.
  - Only single-line `key: value` pairs match (`key` is `[A-Za-z0-9_]+`); keys are lowercased.
    Non-matching lines are skipped, so **multi-line YAML (block lists, nested maps) is not
    parsed** — only inline forms.
  - A value shaped like `[a, b]` becomes an array: split on commas, trimmed, unquoted, empty
    entries dropped. Every other value is a string with one layer of surrounding quotes
    stripped.
  - A `type` value is additionally lowercased.

- `linkTarget(raw)` — reduces a raw wikilink body to its target note name by dropping
  `|alias`, `#heading`, and `^block` suffixes, then trimming.

- `extractWikilinks(text)` — runs `stripCode` first, then collects every `[[…]]` target
  (via `linkTarget`) in order, duplicates included.

- `namesFor(basenameNoExt, fm)` — the set of lowercased names a note answers to: its filename
  stem, plus `title` and each of `aliases` from its frontmatter when present.

- `resolveLinks(targets, knownNames)` — partitions wikilink targets against a Set of
  lowercased known names into `{ resolved, unresolved }` (unresolved = cross-branch or
  broken); empty targets are dropped. Matching is case-insensitive on the target side.

## Connections

Feeds the gate `check` functions run by [[gate-runner]] in [[research-plugin]],
[[grounding-wiki-plugin]], and [[educate-plugin]] — frontmatter fields drive status/lifecycle
checks (see [[lifecycle-engine]]) and wikilink resolution drives link-integrity checks, per
[[gates-convention]]. Because of the inline-only limit, consumers needing block-list
frontmatter (such as the `sources:` lists of [[grounded-corpus-spec]] notes) parse those
fields themselves and use this module only for the scalar/inline ones. Ships in every plugin
as part of the [[chassis]]; exercised by the [[test-suite]].

## Operational notes

- No environment variables, no I/O — pure string functions, easy to test in isolation.
- The inline-only frontmatter limit means notes whose metadata must survive the gates should
  keep values on one line (or as inline `[…]` arrays); block-style YAML values are silently
  invisible to the parser.
- `parseFrontmatter` returning `null` (no leading `---` block) is a signal, not an error:
  gates use it to skip non-note markdown files.
