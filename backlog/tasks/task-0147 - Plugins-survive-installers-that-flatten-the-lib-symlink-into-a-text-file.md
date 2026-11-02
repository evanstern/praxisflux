---
id: TASK-0147
title: Plugins survive installers that flatten the lib symlink into a text file
status: Done
assignee:
  - '@claude'
created_date: '2026-11-02 15:14'
updated_date: '2026-11-02 16:02'
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
- [x] #1 Every plugin's lib/ is a real directory identical to repo-root lib/, with a drift check that fails the suite on divergence
- [x] #2 test/install-path.test.mjs simulates an archive install that writes symlinks as text files and proves all ten plugins' lib-importing modules load and Stop hooks run
- [x] #3 build.mjs, new-plugin.mjs, docs (README, skill-patterns, wiki) reflect the vendored chassis; versions bumped; CI green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/sync-lib.mjs: replace each registered plugin's lib (symlink or file) with a real copy of repo-root lib/; --check reports drift.
2. Run it; commit the ten vendored copies.
3. build.mjs/new-plugin.mjs/build-npm.mjs: drop symlink special-casing; new-plugin copies lib.
4. Tests: sync-lib drift; install-path adds a flattened-symlink archive layout over all ten plugins (Stop hook + every lib-importing module loads).
5. Docs (README, skill-patterns), version bump, wiki-update.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented on branch task-0147-vendored-lib in worktree gracious-shaw-1fb937 (dispatched sonnet-implementer, served cc/claude-sonnet-5[1m]).

Commits (all node --test green at each step, full suite 1363 tests passing):
1. a9f87cb — vendor real lib/ copy into all 10 plugins (scripts/sync-lib.mjs); fix pdlc/scripts/pdlc.mjs's ../../lib -> ../lib import depth; update test/pdlc.test.mjs's symlink assertion.
2. 1f94743 — simplify scripts/build.mjs (drop dead symlink-swap branch), scripts/new-plugin.mjs (cpSync instead of symlinkSync), scripts/build-npm.mjs (comment only, code unchanged); update test/build.test.mjs and test/new-plugin.test.mjs fixtures/assertions.
3. 9f076ce — add test/sync-lib.test.mjs (driftReport empty for repo; fixture catches tampered/missing files).
4. c1cc9f6 — extend test/install-path.test.mjs with simulateFlattenedArchive() (reproduces the desktop app's symlink-to-text-file extraction); covers all 10 catalog plugins' lib/ survival + every .mjs module's import resolution, plus Stop-hook spawn from the flattened tree for the 6 hook-shipping plugins.
5. b2391ed — docs: README.md and docs/skill-patterns.md rewritten from "lib -> ../lib symlink, dereferenced at install" to "vendored copy, stamped by scripts/sync-lib.mjs"; dropped the now-false core.symlinks platform-support claim.
6. 4add6c0 — version bump 1.0.1 -> 1.0.2 (patch) via scripts/sync-version.mjs.

Final verification (all green): node --test (1363/1363), check-docs.mjs, sync-version.mjs --check, gen-marketplace.mjs --check, build.mjs, sync-lib.mjs --check.

Not done (per dispatch instructions): wiki-update (orchestrator's), AC ticks, Done status.

No judgment-call escalations needed — spec covered every decision.

Dispatch: tier=sonnet pinned=cc/claude-sonnet-5[1m] served=cc/claude-sonnet-5[1m]
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Each plugin now ships a real, committed lib/ copy stamped from repo-root lib/ by scripts/sync-lib.mjs (test/sync-lib.test.mjs fails on drift), so installers that write symlinks as text files (Claude desktop app marketplace sync) no longer break ../lib imports. pdlc.mjs fixed from ../../lib to ../lib. install-path test adds a flattened-archive layout: all ten plugins' modules import cleanly and all six Stop hooks run. build/new-plugin simplified, docs + wiki re-verified, version 1.0.2.
<!-- SECTION:FINAL_SUMMARY:END -->
