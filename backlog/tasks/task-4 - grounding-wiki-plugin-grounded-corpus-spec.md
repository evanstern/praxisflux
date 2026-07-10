---
id: TASK-4
title: grounding-wiki plugin + grounded-corpus spec
status: Done
assignee:
  - '@claude'
created_date: '2026-07-08 19:19'
updated_date: '2026-07-10 22:17'
labels: []
dependencies: []
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Standardize the grounded corpus (interlinked MD notes with provenance frontmatter) as the praxis interchange contract, and add a grounding-wiki plugin that produces/maintains code-grounded corpora. Reference deployment: a local reference repo's docs/wiki. Tools compose only through the corpus files — never by calling each other. (Migrated from a stray praxis clone where it was authored as TASK-3; renumbered here.)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/corpus-spec.md defines the versioned corpus format: common note core, web + code provenance dialects, freshness semantics, and the no-per-consumer-fields guardrail
- [x] #2 grounding-wiki plugin exists: plugin.json, wiki-build and wiki-update skills in the gate->work->gate shape, code-dialect note template
- [x] #3 gates/freshness.mjs (read-only, chassis-based) + cli.mjs entry: exit 1 listing stale notes whose sources changed after their verified_against pin
- [x] #4 marketplace.json lists grounding-wiki and gen-marketplace.mjs --check passes
- [x] #5 tests under test/ cover the freshness gate; node --test green
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped docs/corpus-spec.md (v1) and the grounding-wiki plugin (wiki-build + wiki-update skills, freshness gate on the chassis, note template, README). Marketplace regenerated clean; 4 new tests green; gate verified end-to-end against a reference repo's docs/wiki (21 notes fresh). Migrated from a stray clone (authored there as TASK-3) and renumbered.
<!-- SECTION:FINAL_SUMMARY:END -->
