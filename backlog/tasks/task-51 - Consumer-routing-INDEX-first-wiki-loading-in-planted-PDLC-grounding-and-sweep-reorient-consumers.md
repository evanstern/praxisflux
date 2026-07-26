---
id: TASK-51
title: >-
  Consumer routing: INDEX-first wiki loading in planted PDLC grounding and
  sweep/reorient consumers
status: To Do
assignee: []
created_date: '2026-07-26 02:31'
labels:
  - wiki-token-economy
dependencies:
  - TASK-48
priority: medium
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make the corpus-spec v2 consumption protocol (TASK-48) binding on consumers: the pdlc-planted CLAUDE.md block instructs INDEX-first, just-in-time wiki loading (never bulk-load), and sweep/reorient skills orient whole-corpus work on the CAPSULES.md rollup instead of full note bodies. Released surfaces: pdlc + reorient plugins; bump versions per docs/releasing.md. Flagged experiment from the analysis: reorient evaluators fed the capsule rollup instead of note bodies should be A/B-checked for quality loss during the next reorient run (record as a note on this task, not new scope).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pdlc bootstrap template CLAUDE.md block states the loading protocol: INDEX.md first, notes just-in-time, no bulk-loading
- [ ] #2 sweep SKILL.md orients on CAPSULES.md (when present) for whole-corpus grounding steps
- [ ] #3 reorient SKILL.md/evaluator prompts prefer the capsule rollup for corpus-wide orientation, full notes on demand
- [ ] #4 Skill and marketplace versions bumped per docs/releasing.md
<!-- AC:END -->
