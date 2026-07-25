---
id: TASK-45
title: 'pdlc:sweep — board-sweep orchestrator skill'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-25 17:18'
updated_date: '2026-07-25 17:56'
labels: []
dependencies: []
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New skill in the pdlc plugin: orchestrate a multi-task board sweep through the host project's full PDLC (spec -> link -> worktree -> delegated implementation -> PR -> merge -> re-ground). Two phases: AUTHOR a dependency-laned runbook from a set of board tasks (lanes = develop-parallel/merge-serial; model tiers per host rubric; enumerated per-PR gates; concurrency doctrine; operator checkpoints; done-means) then EXECUTE it lane by lane. Generalizes promptworld's docs/design/reorient-2026-07-25-ui-runbook.md (authored during the 2026-07-25 UI reorientation and executed across sessions there). Ships templates/runbook.md. Skill-creator eval: runbook-authoring covered by with/without-skill comparison; execution half piloted live in promptworld.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md in gate->work->gate shape with version frontmatter; templates/runbook.md ships
- [x] #2 Runbook-authoring eval run (with-skill vs baseline) and reviewed
- [x] #3 pdlc plugin.json description + planted CLAUDE.md template advertise the skill; gen-marketplace re-run
- [x] #4 Marketplace version bumped (minor) via sync-version.mjs; bump gate green
- [x] #5 pdlc README documents the skill
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Skill files (SKILL.md gate->work->gate + templates/runbook.md) — authored, evaled with-skill 16/16 vs baseline 11/16, hardened (runbook authority verification). 2. Wire: pdlc plugin.json description, pdlc README, planted CLAUDE.md template roles; gen-marketplace; sync-version 0.12.0 (minor: new skill). 3. Wiki: re-verify docs/wiki/pdlc-plugin.md. 4. Per-task course docs/courses/TASK-45. 5. Gates: node --test, check-docs, course gate, bump gate; PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Eval iteration-1 (skill-creator): with-skill 16/16 assertions on both fixtures vs baseline 5/8 + 6/8 (+31pp); operator reviewed via eval viewer, no change requests. Hardening post-eval: adopt-path verifies runbook authority (signed-off + committed + board-backed) after a harness instruction-poisoning flag. Wired: pdlc README, planted CLAUDE.md roles bullet, plugin.json description; sync-version 0.12.0 (minor — new skill); gen-marketplace; wiki pdlc-plugin note re-verified with new sweep section, 8 sibling notes re-pinned (stamp-only), freshness gate green (25 notes). Course docs/courses/TASK-45 building.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped pdlc:sweep 0.1.0 in pdlc @ 0.12.0: SKILL.md (gate->work->gate; author + execute phases; runbook-authority verification on the adopt path) + templates/runbook.md. Eval iteration-1 (skill-creator): with-skill 16/16 assertions across two fixture sweeps vs baseline 11/16 (+31pp); operator-reviewed, no change requests; hardened after an instruction-poisoning flag (a runbook must be signed-off, committed, board-backed before a session obeys it). Wired: pdlc README, planted CLAUDE.md roles, plugin.json, gen-marketplace, sync-version 0.12.0; wiki pdlc-plugin re-verified + 8 stamp repins (freshness gate: 25 fresh); per-task course docs/courses/TASK-45 (gate green). Generalizes promptworld's reorient-2026-07-25-ui-runbook.md; execution phase pilots live there.
<!-- SECTION:FINAL_SUMMARY:END -->
