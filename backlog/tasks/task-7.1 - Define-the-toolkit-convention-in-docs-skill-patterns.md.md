---
id: TASK-7.1
title: Define the toolkit convention in docs/skill-patterns.md
status: To Do
assignee: []
created_date: '2026-07-09 19:28'
labels: []
dependencies: []
parent_task_id: TASK-7
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before extracting anything, write the convention the extractions will follow. Add a section to docs/skill-patterns.md defining shared content modules ('the toolkit'): they live in lib/toolkit/ (markdown guidance + any CSS/JS assets), are vendored into every plugin at build time by scripts/build.mjs exactly like the rest of lib/, and are referenced from skill prose via ${CLAUDE_PLUGIN_ROOT}/lib/toolkit/... (gates keep relative imports). Codify the graceful-degradation rule: a skill that uses a toolkit module must state its inline fallback so it still functions when the module is absent (e.g. a hand-copied skill without lib/). Record the design-unification policy: shared token schema (property names + dark-mode/toggle contract) with per-plugin palette values; codebase-to-course keeps its warm palette and Google Fonts exception. Note that this supersedes-with-context the deferral in docs/handoffs/codebase-to-course-plugin.md: HTML bases stay separate, but token names and toolkit modules are shared.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/skill-patterns.md has a toolkit section covering: home (lib/toolkit/), reference style, vendoring behavior, and the graceful-degradation rule
- [ ] #2 The token-schema-vs-palette policy (shared names, per-plugin values, c2c exceptions) is written down
- [ ] #3 scripts/build.mjs is verified to vendor lib/toolkit/ into built plugins (adjusted if it filters paths)
- [ ] #4 lib/toolkit/ exists with a README or index stub listing planned modules
<!-- AC:END -->
