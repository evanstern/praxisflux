---
id: TASK-1.9
title: Wire the ground-then-teach seam
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - educate
  - research
dependencies:
  - TASK-1.5
  - TASK-1.4
parent_task_id: TASK-1
priority: medium
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
educate:lesson gains a grounding step that points research at the right scope: topic-scope (topics/<topic>/research/, serves the whole series) or lesson-scope (topics/<topic>/<NNN>-<lesson>/research/). A lesson consults topic-scope first, then its own. Soft dependency: fall back to an inline grounding pass if research is not installed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 'teach me X, research first, sources: ...' grounds then teaches, citing the grounding
- [ ] #2 grounding scope (topic vs lesson) is chosen by applicability
- [ ] #3 workflow degrades gracefully (inline grounding) when research is not installed
<!-- AC:END -->
