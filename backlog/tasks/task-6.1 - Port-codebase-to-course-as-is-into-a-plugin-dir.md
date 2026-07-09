---
id: TASK-6.1
title: Port codebase-to-course as-is into a plugin dir
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-09 18:48'
updated_date: '2026-07-09 18:49'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Slice 1 of docs/handoffs/codebase-to-course-plugin.md. Plugin dir codebase-to-course/ with .claude-plugin/plugin.json, the skill at skills/codebase-to-course/SKILL.md, prebuilt assets under the skill's references/ (paths unchanged — SKILL.md resolves them relative to its base dir). Source of truth: ~/neumo/projects/codebase-to-course @ 0e3b61a. Prebuilt assets are copied verbatim, never regenerated. Add marketplace entry, then scripts/gen-marketplace.mjs --check. No behavior change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 codebase-to-course/ plugin dir exists with plugin.json, skills/codebase-to-course/SKILL.md, and all references/ assets byte-identical to the standalone repo
- [ ] #2 Plugin listed in .claude-plugin/marketplace.json and gen-marketplace --check passes
- [ ] #3 node --test green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create codebase-to-course/ plugin dir: .claude-plugin/plugin.json (match sibling plugin format)
2. Copy SKILL.md to codebase-to-course/skills/codebase-to-course/SKILL.md and references/* verbatim from ~/neumo/projects/codebase-to-course @ 0e3b61a
3. Verify byte-identical assets (diff -r)
4. Add marketplace entry via scripts/gen-marketplace.mjs (or manual + --check)
5. Run gen-marketplace --check, node --test, scripts/build.mjs if applicable
6. Commit
<!-- SECTION:PLAN:END -->
