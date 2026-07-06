---
id: TASK-1.5
title: Add research as a sibling plugin (drop-anywhere)
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - research
dependencies:
  - TASK-1.2
  - TASK-1.3
parent_task_id: TASK-1
priority: medium
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Package research as its own plugin manifest; keep the planted vault CLAUDE.md; add an unambiguous drop-anywhere sentinel marker so the global Stop hook can detect a vault without false positives; make the hook dispatch ADDITIVE (run every applicable gate) so a tree that is both an educate project and contains research vaults gates both.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 research bootstraps a vault in any folder (drop-anywhere preserved)
- [ ] #2 Stop hook detects a vault via the sentinel with no false positives in unrelated folders
- [ ] #3 a tree that is both an educate project and contains nested research vaults runs both gates
<!-- AC:END -->
