---
id: TASK-5
title: 'Self-contained plugin installs: vendored lib, enforced hooks, cache refresh'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-08 19:30'
updated_date: '2026-07-08 19:30'
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
- [ ] #1 Every plugin dir is self-contained: imports use ../lib/ and a vendored lib/ ships inside each plugin, synced from repo-root lib/ by scripts/sync-lib.mjs (with --check mode)
- [ ] #2 Sync is automatic: pre-commit runs sync-lib --check, and core.hooksPath setup is applied here + documented so the hook actually runs in fresh clones
- [ ] #3 Installed user-level plugins refreshed: caches replaced with self-contained copies, band-aid lib copies removed, hooks + gates verified running from the cache
- [ ] #4 node --test green; gen-marketplace --check green; skill-patterns.md updated (vendoring convention)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rewrite ../../lib/ -> ../lib/ in 11 plugin files. 2. scripts/sync-lib.mjs (copy repo lib/ into each plugin; --check diffs). 3. Run sync; wire into .githooks/pre-commit; set core.hooksPath in clone; document setup. 4. Simplify build.mjs vendoring note. 5. Update skill-patterns.md. 6. Tests + marketplace check. 7. Refresh ~/.claude/plugins/cache/praxis/*; verify from cache. 8. PR stacked on task-4.
<!-- SECTION:PLAN:END -->
