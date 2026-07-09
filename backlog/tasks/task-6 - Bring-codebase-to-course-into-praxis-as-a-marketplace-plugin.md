---
id: TASK-6
title: Bring codebase-to-course into praxis as a marketplace plugin
status: To Do
assignee: []
created_date: '2026-07-09 18:48'
updated_date: '2026-07-09 18:59'
labels: []
dependencies: []
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate the standalone codebase-to-course skill (~/projects/codebase-to-course, symlinked at ~/.claude/skills) into praxis as a plugin that composes with the suite: consumes grounded corpora (docs/corpus-spec.md) when present, gated on the chassis, tested. Plan of record: docs/handoffs/codebase-to-course-plugin.md. Done means: marketplace-installed plugin generates a course end-to-end on a real repo (reference-repo fixture, corpus present, grounded briefs), course gate passes, gen-marketplace --check + node --test green, skill-patterns checklist satisfied.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Plugin installs from the praxis marketplace and generates a course end-to-end on a real repo
- [ ] #2 Course gate passes on the generated output
- [ ] #3 gen-marketplace --check and node --test are green
- [ ] #4 docs/skill-patterns.md new-plugin checklist satisfied
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Slices 1-5 complete (PR #3, cutover executed). Remaining before parent Done: Evan has further skill changes he wants to make, then the end-to-end validation run on reference-repo (install from marketplace, generate course, gate it) — ACs 1-2 stay unchecked until then. AC 3 (checks green) and AC 4 (skill-patterns checklist: plugin.json+marketplace, SKILL.md gate->work->gate, gates/ read-only convention, tests) are satisfied on the branch but left unchecked pending the e2e that proves them from an installed plugin.
<!-- SECTION:NOTES:END -->
