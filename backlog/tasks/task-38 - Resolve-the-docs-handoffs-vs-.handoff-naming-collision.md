---
id: TASK-38
title: Resolve the docs/handoffs vs .handoff naming collision
status: To Do
assignee: []
created_date: '2026-07-23 17:00'
labels: []
dependencies: []
priority: low
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-35's vendored spec input (docs/handoffs/team-review-iteration-3-review.md, 'What should be removed' / process residue): the tracked docs/handoffs/ directory (session notes and vendored design inputs, e.g. the team-review iteration-3 review) shares a name stem with the gitignored .handoff/ runtime transport (lib/handoff.mjs), and the two concepts are unrelated — a reader greps one and finds the other. Rename ONE of them (renaming the tracked docs dir, e.g. to docs/design-inputs/ or docs/session-notes/, is far cheaper than renaming the shipped transport contract) and update every reference: team-review/README.md, docs/wiki notes that cite docs/handoffs paths (team-review-plugin, skill-patterns history), TASK notes are historical and stay as-is. The transport name .handoff/ is released surface (handoff-protocol.md, pdlc gitignore planting) and should not change without a major-bump reason.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exactly one of the two names changes; the gitignored .handoff/ transport contract is untouched
- [ ] #2 All in-repo references to the renamed path resolve (grep clean); wiki freshness and check-docs green
- [ ] #3 docs/handoff-protocol.md or the renamed dir's README states the distinction so the collision cannot silently return
<!-- AC:END -->
