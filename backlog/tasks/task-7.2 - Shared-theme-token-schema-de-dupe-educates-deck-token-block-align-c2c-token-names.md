---
id: TASK-7.2
title: >-
  Shared theme-token schema: de-dupe educate's deck token block, align c2c token
  names
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:28'
updated_date: '2026-07-09 20:44'
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
- [x] #1 educate's deck template no longer hand-maintains a divergent copy of the base.html token/toggle block; the single source of truth is lib/html/base.html
- [x] #2 codebase-to-course uses the shared token names and dark-mode contract while keeping its own palette values and documented exceptions
- [x] #3 research's artifact-layer.md instructions remain accurate (still copy-from-base)
- [x] #4 Existing deck, course, and artifact outputs still render correctly in light and dark and pass their plugins' gates
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
EDUCATE (build-time stamp, as agreed):
1. lib/html/base.html: wrap the four token blocks in /* praxis:tokens:start|end */ markers; refactor the toggle IIFE into a marked shared core function praxisCycleTheme(btn) (// praxis:theme:start|end) with state on btn.dataset.mode, bound via addEventListener.
2. educate/templates/.template/deck.html: replace the hand-copied token blocks with the stamped praxis:tokens region (adds unused --bg, harmless) plus a separate deck-only token block (--stage) outside the markers; replace the toggle IIFE with the stamped praxis:theme region; nav button calls praxisCycleTheme(this).
3. scripts/sync-theme.mjs (repo-level, like other build tooling): extracts marked regions from base.html and stamps them into deck.html; --check exits 1 on drift. Exported helpers for tests.
4. test/theme-sync.test.mjs: deck's stamped regions byte-match base.html's (drift is a test failure, so pre-commit enforces sync); existing html-base.test.mjs keeps asserting theme contract + self-containment.
C2C (additive alias, not a rename — styles.css is a prebuilt asset whose header forbids regeneration; its dark contract already matches: data-theme on <html> + prefers-color-scheme via pre-paint script):
5. styles.css: add a ~14-line 'praxis shared token schema' alias block (--bg/--card/--ink/--muted/--accent/--accent2/--warn/--line/--chip/--callout-bg/--warn-bg/--ok-bg/--sans/--mono -> var(--color-*)); aliases auto-follow dark mode since the underlying c2c tokens flip. Document in design-system.md.
6. Verify: full suite + course gate fixture; run sync --check; visual spot check of deck template + a real course page not required beyond gates (values unchanged in educate; c2c additive only).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the agreed build-time stamp: lib/html/base.html now carries praxis:tokens / praxis:theme marker lines around the canonical token blocks and a new shared theme-cycle core (praxisCycleTheme(btn), state on btn.dataset.mode so any page binds its own button). New repo-level scripts/sync-theme.mjs stamps the marked regions into educate's deck template (--check exits 1 on drift); test/theme-sync.test.mjs runs driftReport() in the suite, so pre-commit blocks drift. Deck template now has an empty-until-stamped marker region + a separate deck-only token block (--stage); its bespoke toggle IIFE is gone (nav button calls the stamped shared core). Token values unchanged — decks render identically. C2C: chose an ADDITIVE alias block over a rename — styles.css is a prebuilt asset ('never regenerate') with ~40 richly-used --color-*/scale tokens; a rename would be a huge, risky diff for no interop gain. The new 'praxis shared token schema' block maps the 14 shared names onto course tokens (aliases resolve through --color-*, so they flip with dark mode automatically — verified the dark block redefines every aliased var). c2c's dark contract already matched (data-theme on <html>, pre-paint script, OS default). Documented in design-system.md's dark-mode section (aliases = interop surface, not a second palette). research artifact-layer.md step 0 verified still accurate. Suite 39/39; build vendors both (dist deck stamped, dist styles.css has the alias block).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
base.html is now the single hand-edited source of the theme contract: marked praxis:tokens/praxis:theme regions are stamped into educate's deck template by the new scripts/sync-theme.mjs, with drift failing the test suite (test/theme-sync.test.mjs). The deck's hand-copied ~85-line token/toggle duplicate is gone; deck-only tokens (--stage) live outside the markers; rendering is unchanged (identical values). codebase-to-course adopts the shared token NAMES via an additive 14-alias block in styles.css mapped onto its own palette (auto-flipping in dark mode since aliases resolve through --color-*), documented in design-system.md — no rename of its prebuilt assets, honoring the verbatim invariant. research's copy-from-base instructions verified still accurate. 39/39 tests, all gates green.
<!-- SECTION:FINAL_SUMMARY:END -->
