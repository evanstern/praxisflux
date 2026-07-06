---
id: TASK-1.6
title: Shared HTML base + self-contained verifier
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - html
  - chassis
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: medium
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One templates/html base (reset, light/dark theme variables, theme-toggle boilerplate, auditable-data-table pattern) that BOTH educate's deck.html and research's *-briefing.html derive from; both validated by lib/selfcontained.mjs. Pairs with the artifact-design/dataviz skills.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 deck and briefing both render from the shared base
- [ ] #2 selfcontained verifier passes both and rejects external loads / missing <title>
- [ ] #3 light + dark theming works in both
<!-- AC:END -->
