---
id: TASK-50
title: >-
  Apply corpus-spec v2 to docs/wiki: trim capsules, split oversized notes,
  generate the rollup
status: Done
assignee:
  - '@claude'
created_date: '2026-07-26 02:31'
updated_date: '2026-07-26 05:25'
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

Spec: specs/005-wiki-v2-conformance
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every docs/wiki note description is within the capsule budget and written for routing
- [x] #2 No note body exceeds the size cap; oversized notes (at minimum build-and-release.md) split per summary-style discipline with parent summaries + wikilinks
- [x] #3 docs/wiki/CAPSULES.md generated and committed; INDEX.md updated for any new child notes
- [x] #4 Wiki freshness gate and check-docs pass on the reworked corpus
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 005-wiki-v2-conformance (hand-authored per host precedent)
2. spec-bridge:link
3. Dispatch implementation: trim all docs/wiki descriptions to <=500-char routing capsules; split build-and-release.md summary-style (only over-cap note, within the <=3-note checkpoint bound); generate docs/wiki/CAPSULES.md via grounding-wiki scripts/capsules.mjs (adoption flips enforcement to hard); INDEX gains child-note lines
4. Gates green (freshness now hard-enforcing); per-task course; PR; merge; re-ground; sweep close
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 3 (docs/design/wiki-token-economy-runbook.md). Tier: default implementer (editorial splitting + mechanical conformance driven by TASK-49 tooling). Split fan-out checkpoint: one note over cap (build-and-release.md, 3742 over) — within the operator-approved bound.

Measured: zero capsule violations (max 467); one body violation (build-and-release.md 11742). Split summary-style into release-pipeline.md (4437) + gates-consumption-surface.md (3494), parent now 7635, INDEX +2 additive lines, pins two-step to the split commit. CAPSULES.md generated last (adoption → hard enforcement). 27 notes fresh, zero v2 warnings, 167 tests, check-docs + course gate green. No exemptions, no STOP conditions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
docs/wiki now conforms to and has adopted corpus-spec v2: every capsule within the 500-char budget (max 467), build-and-release.md split summary-style into release-pipeline + gates-consumption-surface children (all bodies <=8000, max 7930, no exemptions), INDEX gained two additive lines, and docs/wiki/CAPSULES.md is generated — flipping the freshness gate to hard budget enforcement, which passes with zero warnings across the 27-note corpus. Docs-only diff, no version bump. The wiki-token-economy sweep's corpus work is complete.
<!-- SECTION:FINAL_SUMMARY:END -->
