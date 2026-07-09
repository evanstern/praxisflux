---
id: TASK-5
title: >-
  Fix build/release plugin discovery: derive from marketplace.json + refresh
  README
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 15:10'
updated_date: '2026-07-09 15:11'
labels: []
dependencies: []
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
build.mjs hardcoded the plugin list (educate/research/build) and silently omitted grounding-wiki from dist/. Derive the build list from .claude-plugin/marketplace.json (single source of truth), add a drift guard warning for unregistered plugin dirs, and refresh README.md (Plugins table, loop diagram, install) which was likewise missing grounding-wiki.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 build.mjs builds every plugin registered in marketplace.json (incl. grounding-wiki)
- [x] #2 build.mjs warns on a top-level plugin dir not registered in marketplace.json
- [x] #3 README.md lists all registered plugins and an accurate loop diagram + install steps
- [x] #4 node scripts/build.mjs produces dist/ with all 4 plugins, no spurious warnings
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Derive ALL from marketplace.json in build.mjs (drop hardcoded list). 2. Add drift guard: warn on top-level plugin dir absent from manifest. 3. Refresh README.md: add grounding-wiki, fix loop diagram + install. 4. Verify: node scripts/build.mjs → dist/ has all 4, no spurious warnings.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
build.mjs: ALL now = marketplace.plugins.map(p=>p.name); added top-level plugin-dir drift guard (skips dist/node_modules/dotfiles). README: Plugins table + loop diagram (research & grounding-wiki as two grounding sources) + install now cover all 4. Verified: node scripts/build.mjs packaged educate/research/build/grounding-wiki, no warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
build.mjs now derives its plugin list from .claude-plugin/marketplace.json (single source of truth) instead of a hardcoded array, so all registered plugins — including the previously-omitted grounding-wiki — are packaged into dist/. Added a drift guard that warns when a top-level plugin dir isn't registered in the manifest. Refreshed README.md (Plugins table, loop diagram, install steps) which was likewise stale. Verified end-to-end.
<!-- SECTION:FINAL_SUMMARY:END -->
