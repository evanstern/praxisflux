---
id: TASK-38
title: Resolve the docs/handoffs vs .handoff naming collision
status: Done
assignee:
  - '@claude'
created_date: '2026-07-23 17:00'
updated_date: '2026-07-26 15:54'
labels: []
dependencies: []
priority: low
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-35's vendored spec input (docs/handoffs/team-review-iteration-3-review.md, 'What should be removed' / process residue): the tracked docs/handoffs/ directory (session notes and vendored design inputs, e.g. the team-review iteration-3 review) shares a name stem with the gitignored .handoff/ runtime transport (lib/handoff.mjs), and the two concepts are unrelated — a reader greps one and finds the other. Rename ONE of them (renaming the tracked docs dir, e.g. to docs/design-inputs/ or docs/session-notes/, is far cheaper than renaming the shipped transport contract) and update every reference: team-review/README.md, docs/wiki notes that cite docs/handoffs paths (team-review-plugin, skill-patterns history), TASK notes are historical and stay as-is. The transport name .handoff/ is released surface (handoff-protocol.md, pdlc gitignore planting) and should not change without a major-bump reason.

Spec: specs/013-design-inputs-rename
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Exactly one of the two names changes; the gitignored .handoff/ transport contract is untouched
- [x] #2 All in-repo references to the renamed path resolve (grep clean); wiki freshness and check-docs green
- [x] #3 docs/handoff-protocol.md or the renamed dir's README states the distinction so the collision cannot silently return
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 013-design-inputs-rename (hand-authored)
2. spec-bridge:link
3. Dispatch: git mv docs/handoffs/ -> docs/design-inputs/ (tracked docs dir; the gitignored .handoff/ transport keeps its released name); update every live reference (team-review/README.md, wiki notes citing docs/handoffs paths); historical TASK notes stay as-is
4. Versions if released surface touched (team-review README); gates; wiki re-pins; PR; merge; sweep close
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep tail (docs/design/board-clearing-runbook.md), droppable lane — executing. Tier: default implementer (mechanical rename + reference sweep).

Implemented: git mv docs/handoffs -> docs/design-inputs (transport byte-untouched except the reciprocal sentence); every live reference updated (team-review + codebase-to-course READMEs, skill-patterns, specs 011/012, three TASK-35 course pages, wiki bodies/sources) — grep clean outside backlog/ and the verbatim vendored review record; new docs/design-inputs/README.md states the distinction and handoff-protocol.md points back. Marketplace 0.21.0. Five notes re-verified substantively, lockstep re-pins honest, CAPSULES regenerated. 196 tests, check-docs, wiki-freshness, bump gate green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The naming collision is resolved: the tracked notes dir is now docs/design-inputs/ (session notes + vendored design inputs) with a README stating explicitly that it is not the gitignored .handoff/ runtime transport, and handoff-protocol.md points back — the collision cannot silently return. Every live reference updated (grep-clean outside historical board files and the verbatim vendored review record); the transport contract is byte-untouched. Marketplace 0.21.0; affected wiki notes re-verified with sources paths fixed.
<!-- SECTION:FINAL_SUMMARY:END -->
