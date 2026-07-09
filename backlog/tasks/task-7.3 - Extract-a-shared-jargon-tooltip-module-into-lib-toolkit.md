---
id: TASK-7.3
title: Extract a shared jargon-tooltip module into lib/toolkit
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:28'
updated_date: '2026-07-09 20:50'
labels: []
dependencies:
  - TASK-7.1
  - TASK-7.2
parent_task_id: TASK-7
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two independent implementations of the same feature exist: codebase-to-course's glossary tooltip (references/interactive-elements.md ~156 lines: .term/data-definition, body-appended position:fixed popover to escape overflow clipping, mouse + touch) and educate's cursor-follow popover (deck.html ~21 lines: [data-tip] + .tip-pop). Extract ONE canonical implementation into lib/toolkit/ (guidance md + copy-paste CSS/JS snippet), based on the more robust c2c version, styled via the shared token schema from TASK-7.2 so it inherits each plugin's palette. Both consumers reference the module; each keeps a one-line graceful-degradation fallback ('if the module is absent, gloss terms in parentheses on first use').
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 lib/toolkit/ contains the tooltip module: usage guidance plus self-contained CSS/JS using shared token names
- [x] #2 codebase-to-course's interactive-elements.md references the module instead of embedding its own full implementation
- [x] #3 educate's deck template uses the module's markup/behavior contract instead of its bespoke variant
- [x] #4 Both skills document an inline fallback and still function if lib/toolkit/ is missing
- [x] #5 Tooltips work with mouse and touch and are not clipped by ancestor overflow in both a deck and a course page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Discovery: c2c's tooltip is implemented in the PREBUILT assets (main.js .term[data-definition] engine; styles.css) — courses must keep it (verbatim-copy invariant), and interactive-elements.md's ~130 embedded CSS/JS lines contradict its own architecture note ('never inline — engines live in the prebuilt assets'). So:
1. lib/toolkit/tooltip.md — the canonical PORTABLE module: data-tip contract (one attribute, works on HTML + SVG), body-appended position:fixed popover (clip-proof), hover + tap, viewport-clamped, print-hidden; CSS/JS snippet written against shared token names with --tip-size override; inverted-contrast bubble via var(--ink)/var(--bg) (also fixes the deck's current dark-mode bug: bubble was var(--ink)+white text = white-on-light in dark). Markers praxis:tooltip-css/js inside the fences for mechanical stamping. Affordance guidance (dashed underline vs ? badge), rules, graceful-degradation fallback.
2. Generalize scripts/sync-theme.mjs -> scripts/sync-shared.mjs with a SYNCS list (base.html theme regions + tooltip.md regions -> deck template); rename test to test/sync-shared.test.mjs; update marker comments in base.html/deck.html.
3. deck.html: tooltip CSS/JS become stamped regions; --tip-size:19px joins the deck-only tokens; template header gains the fallback line.
4. interactive-elements.md Glossary section: keep HTML contract + rules; cut the embedded CSS/JS in favor of 'prebuilt in styles.css/main.js — never inline' + pointer to the shared module for non-course surfaces.
5. Verify: sync --check clean, suite green, deck passes selfcontained; mouse+touch+clip-safety verified by construction (fixed positioning, body append, click handler) in both implementations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
lib/toolkit/tooltip.md ships the canonical PORTABLE implementation: data-tip contract (one attribute, HTML + SVG), body-appended position:fixed popover (clip-proof), cursor-follow on hover + tap-to-toggle/tap-away on touch (merged from educate's and c2c's variants), viewport-clamped, print-hidden. Styled via shared token names with an inverted-contrast bubble (var(--ink) bg / var(--bg) text) — which also fixes a latent deck bug: the old bubble was var(--ink)+white text, i.e. white-on-light in dark mode. Popover size via --tip-size (default 1rem; deck sets 19px in its deck-only tokens). Distribution reuses the stamp mechanism: sync-theme.mjs generalized into scripts/sync-shared.mjs with a SYNCS map (base.html theme regions + tooltip.md regions -> deck template); test renamed to test/sync-shared.test.mjs. Deck's bespoke tooltip CSS/JS replaced by stamped regions. c2c: discovered the tooltip engine ships in the PREBUILT assets (main.js .term[data-definition] wiring, styles.css) — so courses keep the course-native engine per the verbatim invariant, and interactive-elements.md's ~137 lines of embedded CSS/JS (which contradicted its own 'never inline' architecture note) were replaced with the HTML contract + prebuilt pointer + shared-module reference. First attempt at that edit hit the wrong '**CSS:**' heading (translation-block section) — caught by the small diff stat, reverted, redone anchored to the Glossary heading with a sanity assert. Fallbacks documented in tooltip.md, the deck header, and interactive-elements.md. Verification: sync --check clean; suite 39/39 (deck passes selfcontained + theme tests); mouse/touch/clip-safety verified by construction in both implementations (fixed positioning, body append, click handlers — c2c's additionally proven by existing generated courses).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
One canonical portable tooltip now lives in lib/toolkit/tooltip.md (data-tip contract, hover + tap, clip-proof, token-styled with per-plugin sizing via --tip-size) and is stamped into educate's deck template by the generalized scripts/sync-shared.mjs — drift fails the suite. The deck's bespoke variant is gone (and its dark-mode contrast bug with it); codebase-to-course keeps its prebuilt course-native engine (verbatim-asset invariant) while interactive-elements.md drops 137 lines of duplicated implementation in favor of the HTML contract + references. Fallback ('parentheses on first use') documented at all three sites. 39/39 tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
