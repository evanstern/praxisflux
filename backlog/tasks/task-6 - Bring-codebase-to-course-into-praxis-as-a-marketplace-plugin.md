---
id: TASK-6
title: Bring codebase-to-course into praxis as a marketplace plugin
status: Done
assignee: []
created_date: '2026-07-09 18:48'
updated_date: '2026-07-09 19:52'
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
- [x] #1 Plugin installs from the praxis marketplace and generates a course end-to-end on a real repo
- [x] #2 Course gate passes on the generated output
- [x] #3 gen-marketplace --check and node --test are green
- [x] #4 docs/skill-patterns.md new-plugin checklist satisfied
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Slices 1-5 complete (PR #3, cutover executed). Remaining before parent Done: Evan has further skill changes he wants to make, then the end-to-end validation run on reference-repo (install from marketplace, generate course, gate it) — ACs 1-2 stay unchecked until then. AC 3 (checks green) and AC 4 (skill-patterns checklist: plugin.json+marketplace, SKILL.md gate->work->gate, gates/ read-only convention, tests) are satisfied on the branch but left unchecked pending the e2e that proves them from an installed plugin.

E2E validation confirmed by Evan (2026-07-09): plugin installed from the praxis marketplace, generated a course on reference-repo (corpus present), course gate passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Migrated codebase-to-course from its standalone repo into praxis as a marketplace plugin: ported the skill (6.1), made analysis corpus-aware (6.2), defaulted output to docs/course/ (6.3), added gates/course.mjs on the chassis (6.4), executed the cutover making praxis its home (6.5), and applied skill content tweaks (6.6). Verified end-to-end on reference-repo: marketplace install -> course generation -> course gate pass, with gen-marketplace --check and node --test green.
<!-- SECTION:FINAL_SUMMARY:END -->
