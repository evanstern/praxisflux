---
id: TASK-49
title: >-
  grounding-wiki: generate and enforce the token-economy tiers (CAPSULES.md,
  capsule budget, note size cap)
status: Done
assignee:
  - '@claude'
created_date: '2026-07-26 02:31'
updated_date: '2026-07-26 05:08'
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

Spec: specs/003-wiki-capsules-enforcement
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 wiki-build and wiki-update generate CAPSULES.md (index line + capsule per note) as part of corpus output
- [x] #2 Gate fails when a note description exceeds the capsule budget defined in corpus-spec v2
- [x] #3 Gate fails when a note body exceeds the size cap, with message pointing at the summary-style split rule
- [x] #4 CAPSULES.md staleness is detected by the freshness machinery (regenerating it is part of the update pass)
- [x] #5 node --test suite covers the new gate checks and rollup generation
- [x] #6 Skill version and marketplace version bumped per docs/releasing.md
- [x] #7 Spec phase: Spec
- [x] #8 Spec phase: Implement
- [x] #9 Spec phase: Prove
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

Implemented: gates/capsules.mjs (renderCapsules + checkCapsuleTier, deterministic, header w/ generator+commit, INDEX order) + scripts/capsules.mjs writer; freshness gate merges adoption-keyed enforcement (capsule 500 / body 8000 / size_budget_exempt downgrade / regenerate-and-compare staleness; warn-only unadopted). 10 new tests (167 total). wiki-build+wiki-update 0.2.0, marketplace 0.15.0 after post-rebase re-bump (TASK-51 took 0.14.0). grounding-wiki-plugin + test-suite notes re-verified; lockstep re-pins honest two-step. Expected pre-adoption WARN on build-and-release.md (TASK-50's debt, measured: 3742 over).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
grounding-wiki now generates and enforces the corpus-spec v2 token-economy tiers: gates/capsules.mjs renders deterministic CAPSULES.md (generator+commit header, INDEX order) with scripts/capsules.mjs as the single writer, wired into wiki-build/wiki-update; the freshness gate enforces budgets keyed on CAPSULES.md presence (500-char capsules, 8000-char bodies w/ size_budget_exempt downgrade, regenerate-and-compare rollup staleness) and warn-only for unadopted corpora so docs/wiki stays green until TASK-50 adopts. 167 tests. wiki-build/wiki-update 0.2.0; marketplace 0.15.0 (post-rebase re-bump after TASK-51 released 0.14.0). Unblocks TASK-50.
<!-- SECTION:FINAL_SUMMARY:END -->
