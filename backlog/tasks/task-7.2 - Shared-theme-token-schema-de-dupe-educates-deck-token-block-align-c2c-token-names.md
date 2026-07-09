---
id: TASK-7.2
title: >-
  Shared theme-token schema: de-dupe educate's deck token block, align c2c token
  names
status: To Do
assignee: []
created_date: '2026-07-09 19:28'
labels: []
dependencies:
  - TASK-7.1
parent_task_id: TASK-7
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
educate/templates/.template/deck.html carries a hand-pasted ~85-line near-identical copy of lib/html/base.html's theme tokens, dual dark-mode overrides, and auto/light/dark toggle JS — the two have already begun to need parallel maintenance. Make base.html the single source: the deck template's token/toggle block is sourced from base.html (generated or synced at build/plant time, or the template instructs copying from ${CLAUDE_PLUGIN_ROOT}/lib/html/base.html the way research's artifact-layer.md already does) rather than hand-maintained. Separately, align codebase-to-course's design-system.md and styles.css to the shared token SCHEMA — same custom-property names and dark-mode/toggle contract — while keeping its own palette values, localStorage persistence, and Google Fonts exception per the locked policy. Do NOT merge c2c's _base.html into lib/html/base.html (prior deferral stands).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 educate's deck template no longer hand-maintains a divergent copy of the base.html token/toggle block; the single source of truth is lib/html/base.html
- [ ] #2 codebase-to-course uses the shared token names and dark-mode contract while keeping its own palette values and documented exceptions
- [ ] #3 research's artifact-layer.md instructions remain accurate (still copy-from-base)
- [ ] #4 Existing deck, course, and artifact outputs still render correctly in light and dark and pass their plugins' gates
<!-- AC:END -->
