---
id: TASK-7
title: >-
  Shared educational/visual toolkit: extract cross-plugin teaching tools into
  lib/toolkit
status: To Do
assignee: []
created_date: '2026-07-09 19:27'
labels: []
dependencies: []
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
codebase-to-course, educate, and research each re-author the same educational methods and visual tooling (theme tokens + dark-mode toggle, jargon tooltips, core pedagogy prose) and enforce the self-contained-page rule unevenly. Factor the genuinely duplicated pieces into a shared content area at lib/toolkit/, vendored into every plugin at build time by scripts/build.mjs — so plugins remain fully independent and installable in isolation. Also build a borrowing seam in both directions so single-owner tools (c2c's interactive elements, educate's SVG-diagram rules) become optional modules siblings can adopt, yielding a unified design language as a side effect.

Locked decisions: (1) shared token SCHEMA with per-plugin palettes — plugins share CSS custom-property names and the dark-mode/toggle contract, but codebase-to-course keeps its warm palette and Google Fonts exception; (2) modules live in lib/toolkit/ (vendored), NOT a separate plugin and NOT synced per-skill copies; (3) graceful degradation is a hard rule — every skill referencing a toolkit module must still function without it (inline fallback), so hand-copied skills survive missing lib/.

Grounding survey (2026-07-09): true duplications are the theme-token block (lib/html/base.html vs a hand-copied ~85-line twin in educate/templates/.template/deck.html), jargon tooltips (c2c references/interactive-elements.md ~156 lines vs educate deck.html ~21 lines), the one-idea-per-screen/show-don't-tell pedagogy prose (authored 3x), and educate's deck stating but never running lib/selfcontained.mjs. NOT duplicated (borrowing candidates): c2c's code-translation blocks, quiz suite, flow diagrams; educate's SVG rules and deck format. Prior deferral to respect: docs/handoffs/codebase-to-course-plugin.md declined merging c2c _base.html into lib/html/base.html (scroll-snap shell vs artifact page — different contract).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All subtasks Done: the four duplications are factored into lib/toolkit/ (or lib/html/) with single canonical copies
- [ ] #2 Every plugin still builds, installs, and passes its gates standalone with no runtime cross-plugin dependency
- [ ] #3 docs/skill-patterns.md documents the toolkit convention including the graceful-degradation rule
<!-- AC:END -->
