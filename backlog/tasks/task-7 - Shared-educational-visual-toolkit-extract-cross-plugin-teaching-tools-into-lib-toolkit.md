---
id: TASK-7
title: >-
  Shared educational/visual toolkit: extract cross-plugin teaching tools into
  lib/toolkit
status: Done
assignee: []
created_date: '2026-07-09 19:27'
updated_date: '2026-07-09 20:57'
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
- [x] #1 All subtasks Done: the four duplications are factored into lib/toolkit/ (or lib/html/) with single canonical copies
- [x] #2 Every plugin still builds, installs, and passes its gates standalone with no runtime cross-plugin dependency
- [x] #3 docs/skill-patterns.md documents the toolkit convention including the graceful-degradation rule
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Epic complete across 7 subtasks. The four true duplications are factored: theme tokens + toggle single-sourced in lib/html/base.html and mechanically stamped into educate's deck template (scripts/sync-shared.mjs; drift fails the suite); one canonical jargon tooltip (lib/toolkit/tooltip.md, stamped likewise); the visual pedagogy written once (pedagogy.md); educate's deck now enforced by lib/selfcontained.mjs through its DoD gate. Both borrowing seams built: c2c's code-translation/quiz/diagram tools and educate's SVG rules ship as portable, token-styled, opt-in toolkit modules (7 modules total in lib/toolkit/). Design policy honored throughout: shared token schema with per-plugin palettes — c2c adopted the shared NAMES via an additive alias block, keeping its warm palette, Google Fonts exception, and untouched prebuilt engines. Independence preserved: lib/toolkit vendors into all five plugins via the existing build (verified in dist/), no runtime cross-plugin dependency, and every consuming skill states an inline fallback. Convention documented in docs/skill-patterns.md §8. Verified by 40/40 tests incl. new drift, deck-gate, and borrow tests, plus a read-only gate run over the real ~/neumo/learn project.
<!-- SECTION:FINAL_SUMMARY:END -->
