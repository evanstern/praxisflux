---
id: TASK-5
title: 'Self-contained plugin installs: vendored lib, enforced hooks, cache refresh'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-08 19:30'
updated_date: '2026-07-08 19:34'
labels: []
dependencies: []
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marketplace installs copy plugin dirs without the repo-root lib/ chassis, so every ../../lib import (hooks, gates) blows up from ~/.claude/plugins/cache — observed as 3 load errors + Stop-hook failures. Make installed plugins self-contained by construction, keep the vendored copies automatically in sync, and refresh already-installed user-level plugins.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every plugin dir is self-contained: imports use ../lib/ and a vendored lib/ ships inside each plugin, synced from repo-root lib/ by scripts/sync-lib.mjs (with --check mode)
- [x] #2 Sync is automatic: pre-commit runs sync-lib --check, and core.hooksPath setup is applied here + documented so the hook actually runs in fresh clones
- [x] #3 Installed user-level plugins refreshed: caches replaced with self-contained copies, band-aid lib copies removed, hooks + gates verified running from the cache
- [x] #4 node --test green; gen-marketplace --check green; skill-patterns.md updated (vendoring convention)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rewrite ../../lib/ -> ../lib/ in 11 plugin files. 2. scripts/sync-lib.mjs (copy repo lib/ into each plugin; --check diffs). 3. Run sync; wire into .githooks/pre-commit; set core.hooksPath in clone; document setup. 4. Simplify build.mjs vendoring note. 5. Update skill-patterns.md. 6. Tests + marketplace check. 7. Refresh ~/.claude/plugins/cache/praxis/*; verify from cache. 8. PR stacked on task-4.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every plugin dir is now self-contained: committed vendored lib/ per plugin (imports rewritten ../../lib -> ../lib in 11 files), scripts/sync-lib.mjs syncs copies from repo-root lib/ with a --check mode wired into pre-commit; core.hooksPath enabled in this clone (it was never set — the hook hadn't been running) and documented in skill-patterns.md. build.mjs simplified to a straight catalog-derived copy. Installed user-level caches replaced with self-contained copies, band-aid lib siblings removed; verified from the cache: grounding-wiki gate OK against akashic (21 fresh), research + educate Stop hooks exit 0.
<!-- SECTION:FINAL_SUMMARY:END -->
