---
id: TASK-1.10
title: Generalized build/release tooling
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:29'
labels:
  - tooling
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: low
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the self-build: build.mjs --plugin <name>|all that scaffolds each plugin from its spec AND vendors lib/ into each plugin (solving the CLAUDE_PLUGIN_ROOT sibling-dir problem at package time). Generalize sync-version across all plugin.json + marketplace entries; add a marketplace.json generator; add a repo-level pre-commit hook (build + version sync + gate self-check).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 packaging vendors lib/ into each plugin so a shipped .plugin is self-contained
- [x] #2 version sync keeps every plugin.json and the marketplace entries consistent
- [x] #3 marketplace.json is generated from the per-plugin manifests
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
scripts/build.mjs: package each plugin into dist/<plugin>/ with repo lib/ vendored to dist/<plugin>/lib and the plugin's ../../lib imports rewritten to ../lib (all lib importers are depth-1). scripts/gen-marketplace.mjs: regenerate .claude-plugin/marketplace.json plugins[] from each plugin's plugin.json (name+description). scripts/sync-version.mjs: set/sync every plugin.json version + marketplace version. .githooks/pre-commit: run node --test. Add dist/ to .gitignore. Verify: build, then run a VENDORED gate from dist (imports resolve via ../lib) — research branch gate + educate --check on the real project.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
scripts/build.mjs vendors repo lib/ into dist/<plugin>/lib and rewrites ../../lib -> ../lib; VERIFIED vendored gates run from dist/ with no repo-root lib (research branch gate exit 0; educate --check clean on the real project). scripts/gen-marketplace.mjs regenerates marketplace.json plugins[] from each plugin.json (+ --check); scripts/sync-version.mjs sets/syncs/-checks versions across plugin.json + marketplace. .githooks/pre-commit runs node --test + gen-marketplace --check + sync-version --check; enabled via core.hooksPath. dist/ gitignored. 19/19 tests.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Build/release toolchain: build.mjs packages each plugin into dist/ with the shared lib/ vendored and imports rewritten (verified runnable standalone), gen-marketplace.mjs keeps the catalog generated from plugin manifests, sync-version.mjs keeps versions consistent, and an enabled pre-commit hook enforces tests + catalog + version consistency.
<!-- SECTION:FINAL_SUMMARY:END -->
