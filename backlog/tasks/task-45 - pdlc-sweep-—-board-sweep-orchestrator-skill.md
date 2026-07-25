---
id: TASK-45
title: 'pdlc:sweep — board-sweep orchestrator skill'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-25 17:18'
updated_date: '2026-07-25 17:44'
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
- [ ] #1 SKILL.md in gate->work->gate shape with version frontmatter; templates/runbook.md ships
- [ ] #2 Runbook-authoring eval run (with-skill vs baseline) and reviewed
- [ ] #3 pdlc plugin.json description + planted CLAUDE.md template advertise the skill; gen-marketplace re-run
- [ ] #4 Marketplace version bumped (minor) via sync-version.mjs; bump gate green
- [ ] #5 pdlc README documents the skill
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Skill files (SKILL.md gate->work->gate + templates/runbook.md) — authored, evaled with-skill 16/16 vs baseline 11/16, hardened (runbook authority verification). 2. Wire: pdlc plugin.json description, pdlc README, planted CLAUDE.md template roles; gen-marketplace; sync-version 0.12.0 (minor: new skill). 3. Wiki: re-verify docs/wiki/pdlc-plugin.md. 4. Per-task course docs/courses/TASK-45. 5. Gates: node --test, check-docs, course gate, bump gate; PR.
<!-- SECTION:PLAN:END -->
