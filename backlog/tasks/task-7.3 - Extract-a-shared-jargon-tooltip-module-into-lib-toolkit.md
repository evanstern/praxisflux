---
id: TASK-7.3
title: Extract a shared jargon-tooltip module into lib/toolkit
status: To Do
assignee: []
created_date: '2026-07-09 19:28'
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
- [ ] #1 lib/toolkit/ contains the tooltip module: usage guidance plus self-contained CSS/JS using shared token names
- [ ] #2 codebase-to-course's interactive-elements.md references the module instead of embedding its own full implementation
- [ ] #3 educate's deck template uses the module's markup/behavior contract instead of its bespoke variant
- [ ] #4 Both skills document an inline fallback and still function if lib/toolkit/ is missing
- [ ] #5 Tooltips work with mouse and touch and are not clipped by ancestor overflow in both a deck and a course page
<!-- AC:END -->
