---
id: TASK-35.1
title: >-
  Pave the road: skill-patterns third placement model + generative
  gen-marketplace
status: Done
assignee:
  - '@claude'
created_date: '2026-07-23 05:16'
updated_date: '2026-07-23 16:24'
labels: []
dependencies: []
parent_task_id: TASK-35
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The two documented dead ends the iteration-3 review proved a new-plugin author hits first (review improvements #1-2). (a) docs/skill-patterns.md §6: add the third placement model — operates on a caller-supplied root, stores state at the invoking root — one paragraph, with the lib/handoff.mjs rooting rule (ensureGitignore at the invoking root ONLY) stated inline. (b) scripts/gen-marketplace.mjs: promote build.mjs's existing unregistered-plugin warning into generation — scan */.claude-plugin/plugin.json, append missing entries with default category/tags — so checklist step 1 is true as written; add a test asserting a fresh unregistered dir gets registered. Do this slice FIRST so the transplant slice lands on the road it paves.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 skill-patterns §6 names the third shape with the handoff rooting rule
- [x] #2 gen-marketplace.mjs registers a previously-unregistered plugin dir; node --test proves it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. docs/skill-patterns.md §6: two -> three placement models; add the caller-supplied-target shape (state at the invoking root) with the lib/handoff.mjs rooting rule inline (ensureGitignore at the invoking root ONLY; pointed at the target it would be a forbidden write).
2. scripts/gen-marketplace.mjs: refactor to exported genMarketplace(repo) per script convention (runAsCli guard); keep re-sync of registered entries; add scan of top-level */.claude-plugin/plugin.json appending unregistered dirs with default category + tags from plugin.json keywords.
3. test/gen-marketplace.test.mjs: fixture repo in temp dir proving a fresh unregistered dir gets registered; existing entries preserved; idempotent second run.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
skill-patterns §6 now 'Three placement models' with the caller-supplied-target shape and the ensureGitignore invoking-root-only rule inline. gen-marketplace.mjs refactored to exported genMarketplace(repo) (runAsCli guard per script convention); scans top-level */.claude-plugin/plugin.json and appends unregistered dirs with category 'productivity' + tags from plugin.json keywords. test/gen-marketplace.test.mjs: 4 tests incl. fresh-unregistered-dir registration and a repo-own-catalog drift check. Full suite 127 pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Paved the road for third-shape plugins: (a) docs/skill-patterns.md §6 renamed to 'Three placement models' and now names the caller-supplied-target shape (operate on a caller-named root, store state at the invoking root) with the lib/handoff.mjs rooting rule stated inline — ensureGitignore/ensureHandoffDir at the invoking root ONLY, never the target. (b) scripts/gen-marketplace.mjs is now generative: exported genMarketplace(repo) re-syncs registered entries and appends any top-level dir carrying .claude-plugin/plugin.json but no marketplace entry (default category 'productivity', tags from plugin.json keywords), making checklist step 1 true as written. Verified with test/gen-marketplace.test.mjs (fresh-unregistered-dir registration, hand-set category/tags preserved, idempotence, repo-own-catalog drift) — full suite 127 pass.
<!-- SECTION:FINAL_SUMMARY:END -->
