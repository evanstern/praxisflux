---
id: TASK-6
title: Bring codebase-to-course into praxis as a marketplace plugin
status: To Do
assignee: []
created_date: '2026-07-09 18:48'
labels: []
dependencies: []
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate the standalone codebase-to-course skill (~/neumo/projects/codebase-to-course, symlinked at ~/.claude/skills) into praxis as a plugin that composes with the suite: consumes grounded corpora (docs/corpus-spec.md) when present, gated on the chassis, tested. Plan of record: docs/handoffs/codebase-to-course-plugin.md. Done means: marketplace-installed plugin generates a course end-to-end on a real repo (akashic fixture, corpus present, grounded briefs), course gate passes, gen-marketplace --check + node --test green, skill-patterns checklist satisfied.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Plugin installs from the praxis marketplace and generates a course end-to-end on a real repo
- [ ] #2 Course gate passes on the generated output
- [ ] #3 gen-marketplace --check and node --test are green
- [ ] #4 docs/skill-patterns.md new-plugin checklist satisfied
<!-- AC:END -->
