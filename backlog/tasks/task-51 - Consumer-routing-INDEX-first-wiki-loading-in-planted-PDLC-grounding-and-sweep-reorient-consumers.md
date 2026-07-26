---
id: TASK-51
title: >-
  Consumer routing: INDEX-first wiki loading in planted PDLC grounding and
  sweep/reorient consumers
status: Done
assignee:
  - '@claude'
created_date: '2026-07-26 02:31'
updated_date: '2026-07-26 04:59'
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

Spec: specs/004-consumer-index-first-routing
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 pdlc bootstrap template CLAUDE.md block states the loading protocol: INDEX.md first, notes just-in-time, no bulk-loading
- [x] #2 sweep SKILL.md orients on CAPSULES.md (when present) for whole-corpus grounding steps
- [x] #3 reorient SKILL.md/evaluator prompts prefer the capsule rollup for corpus-wide orientation, full notes on demand
- [x] #4 Skill and marketplace versions bumped per docs/releasing.md
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 004-consumer-index-first-routing (hand-authored per host precedent)
2. spec-bridge:link
3. Dispatch implementation: pdlc bootstrap template CLAUDE.md block states the corpus-spec v2 loading protocol; sweep + reorient SKILL.md orient whole-corpus steps on CAPSULES.md when present
4. Version bumps (pdlc bootstrap+sweep, reorient skills + marketplace); wiki re-pins (pdlc-plugin, reorient-plugin notes); per-task course; PR; serial merge (smaller-first vs TASK-49, second re-bumps)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 2 (docs/design/wiki-token-economy-runbook.md). Tier: default implementer (scoped skill-prose edits across two plugins; host ships no formal rubric — judgment tier per runbook). A/B experiment note from the analysis: during the next reorient run, compare evaluators fed CAPSULES.md vs full notes; record findings here.

Implemented: planted grounding block gains 4-line corpus-loading rule (INDEX-first, JIT notes, CAPSULES.md orientation, v1 fallback); sweep Phase-1 + re-ground orient capsule-first; reorient lead+evaluators ground capsule-first w/ parked A/B question. Versions: sweep 0.4.0, reorient 0.2.0, bootstrap 0.2.0 (honest owner of templates/), marketplace 0.14.0. Ten wiki notes re-pinned to the lockstep commit (two named notes re-verified; eight stamp-only after diff re-read). 157 tests, check-docs, wiki-freshness, course gate green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Consumers now speak corpus-spec v2: the pdlc-planted grounding block states the loading protocol (INDEX-first routing, just-in-time notes, never bulk-load, CAPSULES.md for whole-corpus orientation with v1 fallback); sweep orients capsule-first at runbook authoring and re-ground; reorient's lead and evaluators ground capsule-first with the capsule-vs-full-notes A/B question parked for the next run. Versions: pdlc:sweep 0.4.0, reorient 0.2.0, pdlc:bootstrap 0.2.0, marketplace 0.14.0. pdlc-plugin + reorient-plugin wiki notes re-verified; ten notes re-pinned to the lockstep commit. All gates green.
<!-- SECTION:FINAL_SUMMARY:END -->
