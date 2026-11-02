---
id: TASK-0147
title: Plugins survive installers that flatten the lib symlink into a text file
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-02 15:14'
updated_date: '2026-11-02 15:16'
labels: []
dependencies: []
ordinal: 174000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Claude desktop app's marketplace sync (2026-11-02) extracts the repo without symlinks: each <plugin>/lib -> ../lib became a 6-byte text file reading ../lib, so every script importing ../lib/... failed with ERR_MODULE_NOT_FOUND and lib-importing Stop hooks did not run. Claude Code's cache install (cache/praxisflux/<plugin>/<version>/) has no shared lib beside the plugin, so ../../lib imports are not an option. Fix: commit a real copy of lib/ in each plugin, kept identical to repo-root lib/ by a sync script plus a drift check.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every plugin's lib/ is a real directory identical to repo-root lib/, with a drift check that fails the suite on divergence
- [ ] #2 test/install-path.test.mjs simulates an archive install that writes symlinks as text files and proves all ten plugins' lib-importing modules load and Stop hooks run
- [ ] #3 build.mjs, new-plugin.mjs, docs (README, skill-patterns, wiki) reflect the vendored chassis; versions bumped; CI green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/sync-lib.mjs: replace each registered plugin's lib (symlink or file) with a real copy of repo-root lib/; --check reports drift.
2. Run it; commit the ten vendored copies.
3. build.mjs/new-plugin.mjs/build-npm.mjs: drop symlink special-casing; new-plugin copies lib.
4. Tests: sync-lib drift; install-path adds a flattened-symlink archive layout over all ten plugins (Stop hook + every lib-importing module loads).
5. Docs (README, skill-patterns), version bump, wiki-update.
<!-- SECTION:PLAN:END -->
