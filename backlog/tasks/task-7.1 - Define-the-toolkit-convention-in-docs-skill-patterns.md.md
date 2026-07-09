---
id: TASK-7.1
title: Define the toolkit convention in docs/skill-patterns.md
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:28'
updated_date: '2026-07-09 19:48'
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
- [x] #1 docs/skill-patterns.md has a toolkit section covering: home (lib/toolkit/), reference style, vendoring behavior, and the graceful-degradation rule
- [x] #2 The token-schema-vs-palette policy (shared names, per-plugin values, c2c exceptions) is written down
- [x] #3 scripts/build.mjs is verified to vendor lib/toolkit/ into built plugins (adjusted if it filters paths)
- [x] #4 lib/toolkit/ exists with a README or index stub listing planned modules
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create lib/toolkit/ with a README.md index: the convention in brief (vendored via build.mjs, referenced as ${CLAUDE_PLUGIN_ROOT}/lib/toolkit/..., graceful degradation mandatory) plus a table of planned modules (tooltip, pedagogy, svg-diagrams, code-translation, quiz-patterns) mapped to TASK-7.x ids.
2. Add a new section to docs/skill-patterns.md ('Shared content modules — the toolkit') covering: home, vendoring behavior (build.mjs copies lib/ wholesale — verified, no filtering), reference style (prose vs gate code), the graceful-degradation rule with an example fallback line, and the design policy: shared token schema + per-plugin palettes, c2c keeps warm palette + Google Fonts; HTML bases stay separate (supersedes-with-context the deferral in docs/handoffs/codebase-to-course-plugin.md).
3. Amend §7's Shared list to include lib/toolkit/.
4. Verify vendoring: node scripts/build.mjs, assert dist/<each plugin>/lib/toolkit/README.md exists.
5. Check ACs, append notes, finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
docs/skill-patterns.md gained §8 'Shared content modules — the toolkit' (home, vendoring, reference style, graceful-degradation hard rule, token-schema/palette policy incl. c2c exceptions and the standing _base.html deferral); §7's Shared list now names lib/toolkit/. lib/toolkit/README.md created with the convention-in-brief and a planned-module index mapped to TASK-7.3/7.4/7.6/7.7. Vendoring verified with zero build.mjs changes needed: it copies lib/ wholesale (cpSync recursive), and a full 'node scripts/build.mjs' shows dist/<plugin>/lib/toolkit/README.md in all five plugins. node --test green (35/35). Context for 7.2/7.5: test/html-base.test.mjs already regex-asserts the deck template is theme-aware + self-contained at repo-test time — but the deck still hand-carries the ~85-line token block (7.2's job) and planted lesson decks in user projects are never verified (7.5's job).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Defined the shared-content-toolkit convention: docs/skill-patterns.md §8 documents lib/toolkit/ (home), build-time vendoring (build.mjs already copies lib/ wholesale — no code change needed), the ${CLAUDE_PLUGIN_ROOT}/lib/toolkit/... reference style with 'gates never import toolkit' boundary, the graceful-degradation hard rule with example fallback, and the design policy (shared token schema + dark-mode contract, per-plugin palettes, c2c warm-palette/Google-Fonts exceptions, HTML shells stay separate per the standing _base.html deferral). §7's Shared list updated. lib/toolkit/README.md stub created with the planned-module index (tooltip, pedagogy, svg-diagrams, code-translation, quiz-patterns, diagrams → TASK-7.3/7.4/7.6/7.7). Verified: full build vendors lib/toolkit/README.md into all five dist plugins; node --test 35/35 green.
<!-- SECTION:FINAL_SUMMARY:END -->
