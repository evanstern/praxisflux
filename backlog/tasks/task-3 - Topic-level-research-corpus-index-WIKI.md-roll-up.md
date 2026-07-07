---
id: TASK-3
title: Topic-level research corpus index (WIKI.md roll-up)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-07 21:25'
updated_date: '2026-07-07 21:36'
labels:
  - educate
  - research
  - docs
dependencies: []
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Each research/ folder under a learning topic is an isolated .research-vault with its own Home.md trunk (series-scope at topics/<topic>/research/, lesson-scope at topics/<topic>/<NNN>-lesson/research/). Today nothing ties a topic's vaults together, so the accumulated corpus isn't navigable/searchable as one body of knowledge. Add a DERIVED roll-up index: topics/<topic>/WIKI.md indexes every research vault under that topic (rolling up each vault's Home.md), and topics/WIKI.md indexes each topic's WIKI.md. Derive-from-disk (like progress.json's artifacts map) so it can't drift; the same generator is the migration path for existing projects (e.g. ~/learn/topics/philosophy). Preserve vault isolation: WIKI.md is a navigation index using plain relative Markdown links, never cross-vault [[wikilinks]] — no bleed between topics. Owned by educate (topic structure is educate's); composes over research outputs via files only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A generator (educate scripts/wiki.mjs, on the lib/ chassis) scans a topic dir for .research-vault roots via findRootsDownwards and reads each vault's Home.md
- [x] #2 wiki.mjs --sync writes topics/<topic>/WIKI.md: frontmatter + a table with one row per vault (scope: series | lesson NNN-slug, relative link to its Home.md, and the wiki topics that vault contains)
- [x] #3 wiki.mjs --all --sync writes topics/WIKI.md indexing each topic's WIKI.md
- [x] #4 WIKI.md uses plain relative Markdown links only (no [[wikilinks]]); vault isolation is preserved and there is no cross-topic content
- [x] #5 wiki.mjs --check (read-only, in gates/) reports WIKI.md staleness without writing; wired into the educate Stop-hook gate as a warning
- [x] #6 progress.mjs --sync regenerates the topic WIKI.md, and the lesson grounding seam regenerates it after research returns
- [x] #7 Running the generator over ~/learn/topics/philosophy produces a correct WIKI.md from the existing Home.md's (migration verified)
- [x] #8 educate templates/CLAUDE.md and skills/lesson document the WIKI layer
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. lib/: add a small vault-index helper (or extend markdown.mjs) to read a Home.md's frontmatter + parse its '## Wikis' table into {topic, about} rows. Reuse parseFrontmatter/findRootsDownwards; add a RESEARCH_VAULT_SENTINEL check ('.research-vault').
2. educate/gates/wiki.mjs (read-only): given a topic dir, enumerate .research-vault roots (series + per-lesson), build the expected WIKI.md content, and expose isStale(topicDir) by comparing to on-disk WIKI.md (ignoring the 'updated' date). Also expose the project-level expectation for topics/WIKI.md.
3. educate/scripts/wiki.mjs (mutating CLI): --root <dir> <topic> --sync writes topics/<topic>/WIKI.md; --all --sync also writes topics/WIKI.md (project index over topic WIKIs); --check delegates to gates/wiki.mjs. Zero deps; matches progress.mjs conventions.
4. Wire freshness: progress.mjs --sync calls the wiki sync for the topic; the Stop-hook gate (stop.mjs/dod) adds a non-fatal staleness WARNING for WIKI.md (never blocks — WIKI is an index, not a DoD artifact).
5. Grounding seam: educate/skills/lesson SKILL.md — after research grounding returns, run scripts/wiki.mjs --sync for the topic. Document the WIKI layer + isolation rule (relative links, no cross-vault wikilinks).
6. Docs: educate/templates/CLAUDE.md gains a 'Corpus wiki' section describing topics/<topic>/WIKI.md + topics/WIKI.md, derived by the script, isolation-preserving.
7. Migration: run scripts/wiki.mjs --all --sync against ~/learn to generate philosophy's topic WIKI.md + the project WIKI.md from existing Home.md's; verify output by hand. (Existing Home.md's are the source; no lesson content touched.)
8. Verify: unit-exercise wiki.mjs on philosophy fixture; run --check to confirm stale->fresh; confirm no [[wikilinks]] emitted and other topics untouched.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: educate/gates/wiki.mjs (read-only derivation: parseWikisTable, readVaultHome, topicVaults, renderTopicWiki/renderProjectWiki, isStale, wikiStalenessWarnings) + educate/scripts/wiki.mjs (mutating CLI: --sync/--check/--all, exports syncTopicWiki/syncProjectWiki). Wired into progress.mjs --sync (regenerates topic + project WIKI after any sync) and the lesson grounding seam. Extended lib/gate-runner with an optional non-blocking warn(root) channel; educate stop.mjs warns on WIKI drift (exit 0, never blocks). Added test/wiki.test.mjs (6 tests, suite 25/25 green). Migration: ran wiki.mjs --all --sync over ~/learn — generated topics/philosophy/WIKI.md (3 vaults: series Arc + 101-socrates + 102-plato, deep MOC links) and topics/WIKI.md; verified idempotent, --check green, zero [[wikilinks]], all deep links resolve. Docs: educate/templates/CLAUDE.md + skills/lesson/SKILL.md gained a corpus-wiki section.
<!-- SECTION:NOTES:END -->
