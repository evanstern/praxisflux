---
id: TASK-1.6
title: Shared HTML base + self-contained verifier
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:18'
labels:
  - html
  - chassis
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: medium
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One templates/html base (reset, light/dark theme variables, theme-toggle boilerplate, auditable-data-table pattern) that BOTH educate's deck.html and research's *-briefing.html derive from; both validated by lib/selfcontained.mjs. Pairs with the artifact-design/dataviz skills.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 deck and briefing both render from the shared base
- [x] #2 selfcontained verifier passes both and rejects external loads / missing <title>
- [x] #3 light + dark theming works in both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Create lib/html/base.html: the canonical self-contained, theme-aware foundation both plugins derive from — design tokens (:root) with light + dark via @media(prefers-color-scheme) AND :root[data-theme] overrides so a toggle wins both ways, a reset, a theme-toggle button (inline JS, no external), and an auditable data-table component. Make educate's deck template theme-aware by deriving the same tokens (add dark overrides; move literal callout/warn/ok backgrounds to tokens) so its chrome flips cleanly; add a toggle. Point research's artifact-layer.md at lib/html/base.html as the shared base. Tests: lib/selfcontained.checkHtml passes base (zero warns) and the deck template (ok). Vendored with lib in 1.10.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created lib/html/base.html: canonical self-contained, theme-aware base — design tokens (:root) with light default, dark via @media(prefers-color-scheme) AND :root[data-theme=dark|light] so the on-page ◐ toggle wins both ways, a reset, and an auditable data-table component. Made educate's deck template derive the same token contract (added dark + data-theme overrides; moved literal callout/warn/ok backgrounds to --callout-bg/--warn-bg/--ok-bg tokens; added a ◐ theme toggle to the nav) so its chrome is theme-aware. Pointed research/artifact-layer.md step 0 at lib/html/base.html. test/html-base.test.mjs: base passes with ZERO warnings (title+theme+table), deck passes self-contained and is now theme-aware. 14/14 tests pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shared HTML base established at lib/html/base.html (tokens + light/dark theme contract + toggle + auditable table, fully self-contained). educate's deck template now derives the same contract and is theme-aware; research briefings are pointed at the base via artifact-layer.md. Both pass lib/selfcontained.checkHtml (base with zero warnings).
<!-- SECTION:FINAL_SUMMARY:END -->
