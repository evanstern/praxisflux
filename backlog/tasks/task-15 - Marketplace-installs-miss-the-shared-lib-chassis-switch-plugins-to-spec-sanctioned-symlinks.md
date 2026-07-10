---
id: TASK-15
title: >-
  Marketplace installs miss the shared lib/ chassis: switch plugins to
  spec-sanctioned symlinks
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 18:01'
updated_date: '2026-07-10 18:09'
labels: []
dependencies: []
priority: high
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Installed plugins crash at runtime with ERR_MODULE_NOT_FOUND: marketplace.json points source at raw plugin dirs, Claude Code copies ONLY that dir into ~/.claude/plugins/cache/, and every hook/gate imports ../../lib/* which resolves outside the copy. The dist/ vendoring in scripts/build.mjs never runs on the marketplace install path (the spec has no build hook). Fix per the official plugins reference: each plugin carries a lib symlink -> ../lib; the cache copy dereferences marketplace-internal symlinks into real copies. Imports move from ../../lib/ to ../lib/ and work identically in-repo (through the symlink) and installed (through the dereferenced copy). Affects spec-bridge, research, educate, grounding-wiki, codebase-to-course runtime .mjs; build.mjs simplifies to a dereferencing copy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each plugin dir that imports the chassis carries a lib symlink to ../lib, committed to git
- [x] #2 All runtime imports use ../lib/ and no plugin .mjs references ../../lib/ anymore
- [x] #3 scripts/build.mjs produces self-contained dist/ output by dereferencing the symlinks (no import rewriting)
- [x] #4 Empirical verification: installing a plugin from the local marketplace yields a cache copy whose stop hook runs without ERR_MODULE_NOT_FOUND
- [x] #5 Test suite passes and marketplace version is bumped per docs/releasing.md
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-15-lib-symlinks off main
2. Create lib -> ../lib symlinks in spec-bridge, research, educate, grounding-wiki, codebase-to-course; commit as symlinks
3. Rewrite all plugin runtime imports ../../lib/ -> ../lib/ (scripts/, gates/, hooks/)
4. Simplify scripts/build.mjs: drop rewriteLibImports + vendoring, copy with dereference:true so dist stays self-contained
5. Run test suite + check-docs; fix fallout (tests referencing plugin files may assume old import shape)
6. Empirical verification: add the repo as a local marketplace copy, install spec-bridge, run cached stop.mjs against a scratch project, confirm no ERR_MODULE_NOT_FOUND
7. Bump marketplace version per docs/releasing.md; wiki freshness pass if the gate flags notes
8. Push, open PR (merge commit flow)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Symlinks + import rewrite + build.mjs simplification committed. All 85 tests pass (node --test). dist/<plugin>/lib is a real dir; packaged spec-bridge stop.mjs runs with exit 0. Note: cpSync dereference:true does NOT materialize dir symlinks met mid-recursion — build.mjs swaps the symlink by hand. Bonus fix found: build:implement SKILL.md executed the chassis via ${CLAUDE_PLUGIN_ROOT}/../lib (same root cause), fixed + skill bumped to 0.1.1.

Empirical verification done in an isolated CLAUDE_CONFIG_DIR: claude plugin marketplace add <repo> + claude plugin install spec-bridge@praxis produced a cache copy where lib/ is a REAL directory (symlink dereferenced by the installer, exactly as the plugins reference documents) and scripts/stop.mjs runs with exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Root cause: marketplace installs copy only the plugin source dir into the cache, so every hook/gate's ../../lib/ import escaped the copy (ERR_MODULE_NOT_FOUND on Stop). Fix per the plugins reference: each of the six plugins now carries a committed lib -> ../lib symlink (dereferenced into a real copy by the installer), all runtime imports moved to ../lib/, build:implement's ${CLAUDE_PLUGIN_ROOT}/../lib reference fixed (skill 0.1.0 -> 0.1.1), and scripts/build.mjs collapsed to a plain copy that swaps the symlink for a real dir. Verified empirically in an isolated CLAUDE_CONFIG_DIR: installed cache copy has a real lib/ and stop.mjs exits 0. 85/85 tests pass; marketplace bumped 0.3.1 -> 0.3.2; wiki (8 notes), README, and skill-patterns re-verified for the symlink model.
<!-- SECTION:FINAL_SUMMARY:END -->
