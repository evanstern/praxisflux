---
id: TASK-1.8
title: Split build/implement into its own plugin
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - build
  - educate
dependencies:
  - TASK-1.6
  - TASK-1.4
parent_task_id: TASK-1
priority: medium
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extract the implementation leg out of educate into a 'build' plugin: educate keeps teaching + authoring the SPEC (forward handoff); build consumes the SPEC, implements + verifies, and emits findings (return handoff). Enforce the most-skipped return leg via a progress.json flag AND a durable-residue check (a Post-build revisions section in the tracked guide.md/raw-notes.md) so it cannot be rubber-stamped.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 educate no longer owns the POST_BUILD return artifact; build does
- [ ] #2 build consumes a SPEC and returns findings over the handoff transport
- [ ] #3 a lesson cannot reach done until the return-leg flag is set AND durable residue exists on disk
<!-- AC:END -->
