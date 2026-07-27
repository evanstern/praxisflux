---
id: TASK-67
title: >-
  Re-plant this repo's PDLC grounding block: pick up the corrected enforcement
  sentence (bootstrap 0.6.0)
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 04:33'
updated_date: '2026-07-27 04:34'
labels:
  - sweep-followup
dependencies: []
priority: medium
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-60 (PR #89) corrected pdlc/templates/CLAUDE.md's Gates rule to ship-reality ("spec-bridge, educate, research, reorient, team-review ship Stop hooks; grounding-wiki's freshness gate is check scripts/CI, not a hook; build, codebase-to-course, pdlc ship none"), but the praxisflux repo's own root CLAUDE.md planted block — and its rendered copy in downstream projects — still carries the old "Plugins ship Stop hooks that enforce this" overclaim. Run pdlc:bootstrap's re-plant against this repo so the planted block matches template 0.6.0. Standing caution (operator-established): hand edits inside planted blocks are deliberate — diff the current block against the OLD template render first, relocate any hand edits outside the block, never clobber them on replant; plant.mjs refuses drifted blocks without --force, so identify whether drift is hand-edit or template-version before forcing. Downstream hosts (promptworld, coda, hermes-praxis) inherit the same staleness and can be refreshed the same way in their own repos (out of this task's scope; note it in the final summary for their sessions). Origin: flagged by TASK-60's implementer during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.

Spec: specs/028-replant-grounding
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 This repo's CLAUDE.md planted block matches the bootstrap 0.6.0 template render (plant check clean; sentinel advanced)
- [ ] #2 Any hand edits found inside the block are preserved (relocated per the diff-first procedure), not clobbered
- [ ] #3 check-docs.mjs and the wiki freshness gate stay green (re-pin pdlc-plugin note if plant artifacts are among its sources)
- [ ] #4 Spec phase: Spec
- [ ] #5 Spec phase: Implement
- [ ] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 028-replant-grounding (hand-authored spec/plan/tasks on branch task-67-replant-grounding) drives. 1. Diff this repo's planted block against the OLD (pre-0.6.0) template render to isolate hand edits vs template drift. 2. Relocate any hand edits outside the block; re-plant via pdlc/scripts/plant.mjs (force only for confirmed template-version drift); sentinel advances. 3. Verify the block matches the 0.6.0 render and the corrected Gates sentence is present. 4. Gates + wiki re-pin if plant artifacts are pinned sources. 5. PR, merge, Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Standard per-task flow (post-sweep follow-up, not part of the closed runbook): tier = orchestrator-direct — small, judgment-bound by the diff-first replant procedure from operator memory.
<!-- SECTION:NOTES:END -->
