---
id: TASK-49
title: >-
  grounding-wiki: generate and enforce the token-economy tiers (CAPSULES.md,
  capsule budget, note size cap)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-26 02:31'
updated_date: '2026-07-26 04:40'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 003-wiki-capsules-enforcement (hand-authored per host precedent)
2. spec-bridge:link
3. Dispatch implementation: grounding-wiki gate enforces capsule budget (500 chars) + note body cap (8000 chars) per corpus-spec v2; wiki-build/wiki-update generate CAPSULES.md; freshness machinery covers the rollup
4. Tests; version bumps (skill + marketplace); wiki re-pin grounding-wiki-plugin note; per-task course; PR; serial merge (smaller-first vs TASK-51, second re-bumps)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 2 (docs/design/wiki-token-economy-runbook.md). Tier: default implementer (chassis/gate code + node --test coverage; host ships no formal rubric — judgment tier per runbook).
<!-- SECTION:NOTES:END -->
