---
id: TASK-1.8
title: Split build/implement into its own plugin
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:25'
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
- [x] #1 educate no longer owns the POST_BUILD return artifact; build does
- [x] #2 build consumes a SPEC and returns findings over the handoff transport
- [x] #3 a lesson cannot reach done until the return-leg flag is set AND durable residue exists on disk
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a durable-residue check to progress.mjs: at status=done in a delegated topic, require handoff.foldedIn AND a return-leg section (## Post-build / Return leg / Build findings) in guide.md or raw-notes.md — so the return leg can't be rubber-stamped. 2. Create build/skills/implement/SKILL.md: reads the pending SPEC request from .handoff/, implements+verifies, writes a findings response handoff (ref back), sets progress evidence, points educate to the return leg. 3. Update educate lesson SKILL.md teach<->build seam to author the SPEC as a .handoff/ request (from:educate to:build, set handoff.specd), hand off to the build PLUGIN, then on return fold findings in + set handoff.returned/foldedIn + write the durable residue. 4. Tests for the residue gate. 5. Verify + commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created the build plugin: build/skills/implement/SKILL.md — reads the pending SPEC request from .handoff/, builds+verifies, writes a findings RESPONSE handoff (ref back), sets progress evidence, points educate to the return leg; explicitly does NOT teach/deck/mark-done. Rewired educate lesson SKILL teach<->build seam to author the SPEC as a .handoff/ request (handoff.specd) -> build plugin -> findings response (handoff.returned) -> return leg folds in (handoff.foldedIn) + durable residue. Added hasReturnLegResidue() to progress.mjs: at done in a delegated topic, requires handoff.foldedIn AND a '## Post-build'/'Return leg'/'Build findings' section in guide.md or raw-notes.md — flag alone cannot rubber-stamp. Tests: return-leg.test.mjs (residue absent->blocked, present->clean) + updated handoff evidence test. 19/19 pass; real project clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
build split into its own plugin. educate authors the SPEC and folds findings back; build (build:implement) consumes the SPEC and returns findings over the .handoff/ transport. educate no longer owns a POST_BUILD file. The return leg is enforced at done: requires handoff.foldedIn evidence AND durable residue (a Post-build section) on disk — verified by tests.
<!-- SECTION:FINAL_SUMMARY:END -->
