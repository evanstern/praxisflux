---
id: TASK-35.1
title: >-
  Pave the road: skill-patterns third placement model + generative
  gen-marketplace
status: To Do
assignee: []
created_date: '2026-07-23 05:16'
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
- [ ] #1 skill-patterns §6 names the third shape with the handoff rooting rule
- [ ] #2 gen-marketplace.mjs registers a previously-unregistered plugin dir; node --test proves it
<!-- AC:END -->
