---
id: TASK-48
title: >-
  Corpus spec v2: token-economy tiers — consumption protocol, capsule tier, size
  caps, section addressability
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-26 02:31'
updated_date: '2026-07-26 04:20'
labels:
  - wiki-token-economy
dependencies: []
priority: high
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evolve docs/corpus-spec.md (the interchange contract) per the vault analysis vault/Grounded-Wiki-Scaling/Analysis-Token-Economy-for-the-Grounding-Wiki.md so grounded corpora stay affordable to load as they grow. Contract-shaped: defines the tiers every conforming corpus and tool consumes; unblocks the enforcement, application, and consumer-routing tasks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 corpus-spec defines the consumption protocol: INDEX.md always loaded, notes loaded just-in-time via index routing, bulk-loading the corpus disallowed as default behavior
- [ ] #2 Capsule tier specified: per-note frontmatter description capped at a stated token budget (~100-150 tokens), written for routing; CAPSULES.md rollup format defined (index line + capsule per note)
- [ ] #3 Note size cap specified (~2k tokens) with summary-style split discipline: split subtopics to child notes leaving summary + wikilink, with an explicit minimum-content counter-rule against stub splits
- [ ] #4 H2 sections defined as the addressable content unit within a note
- [ ] #5 Capsules and CAPSULES.md declared drift surfaces covered by the same sources/verified_against provenance as notes
- [ ] #6 docs/wiki/grounded-corpus-spec.md note re-verified and re-pinned in the same PR
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Hand-author specs/002-corpus-spec-v2 (spec/plan/tasks) per host precedent
2. spec-bridge:link the spec to this task
3. Dispatch implementation (session tier — contract prose): amend docs/corpus-spec.md with consumption protocol, capsule tier + CAPSULES.md format, note size cap + split discipline, H2 addressability; re-pin docs/wiki/grounded-corpus-spec.md same PR
4. Per-task course docs/courses/TASK-48; gates (check-docs, wiki-freshness, tests); PR; serial merge; re-ground
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep: docs/design/wiki-token-economy-runbook.md Lane 1. Tier: session-tier (contract prose over the interchange spec; judgment-heavy, low code volume; host ships no formal rubric — judgment tier per runbook).
<!-- SECTION:NOTES:END -->
