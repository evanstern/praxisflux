---
id: TASK-49
title: >-
  grounding-wiki: generate and enforce the token-economy tiers (CAPSULES.md,
  capsule budget, note size cap)
status: To Do
assignee: []
created_date: '2026-07-26 02:31'
labels:
  - wiki-token-economy
dependencies:
  - TASK-48
priority: high
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement corpus-spec v2 (TASK-48) in the grounding-wiki plugin: wiki-build and wiki-update generate the CAPSULES.md rollup from note descriptions, and the freshness/corpus gate enforces the new budgets so token economy is a property, not a habit. Released surface: bump plugin skill versions + marketplace per docs/releasing.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 wiki-build and wiki-update generate CAPSULES.md (index line + capsule per note) as part of corpus output
- [ ] #2 Gate fails when a note description exceeds the capsule budget defined in corpus-spec v2
- [ ] #3 Gate fails when a note body exceeds the size cap, with message pointing at the summary-style split rule
- [ ] #4 CAPSULES.md staleness is detected by the freshness machinery (regenerating it is part of the update pass)
- [ ] #5 node --test suite covers the new gate checks and rollup generation
- [ ] #6 Skill version and marketplace version bumped per docs/releasing.md
<!-- AC:END -->
