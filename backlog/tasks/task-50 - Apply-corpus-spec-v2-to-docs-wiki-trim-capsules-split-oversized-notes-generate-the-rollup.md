---
id: TASK-50
title: >-
  Apply corpus-spec v2 to docs/wiki: trim capsules, split oversized notes,
  generate the rollup
status: To Do
assignee: []
created_date: '2026-07-26 02:31'
labels:
  - wiki-token-economy
dependencies:
  - TASK-49
priority: medium
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bring the repo's own grounding wiki into conformance with corpus-spec v2 (TASK-48) using the TASK-49 tooling: every description within capsule budget, oversized notes split summary-style (build-and-release.md at 12.7KB is 2.4x the mean), CAPSULES.md generated, all pins fresh, gates green.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every docs/wiki note description is within the capsule budget and written for routing
- [ ] #2 No note body exceeds the size cap; oversized notes (at minimum build-and-release.md) split per summary-style discipline with parent summaries + wikilinks
- [ ] #3 docs/wiki/CAPSULES.md generated and committed; INDEX.md updated for any new child notes
- [ ] #4 Wiki freshness gate and check-docs pass on the reworked corpus
<!-- AC:END -->
