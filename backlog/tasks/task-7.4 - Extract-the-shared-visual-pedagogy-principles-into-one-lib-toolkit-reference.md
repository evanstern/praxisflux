---
id: TASK-7.4
title: Extract the shared visual-pedagogy principles into one lib/toolkit reference
status: To Do
assignee: []
created_date: '2026-07-09 19:28'
labels: []
dependencies:
  - TASK-7.1
parent_task_id: TASK-7
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The core teaching-design prose is authored three separate times in different words: codebase-to-course content-philosophy.md ('Show, Don't Tell — Aggressively Visual', 'One Concept Per Screen', >=50% visual), educate deck.html header ('ONE idea per slide; if crammed, SPLIT it; more slides, never smaller type'), and research artifact-layer.md + lib/html/base.html ('Lead with the point/verdict'). Write one canonical lib/toolkit/pedagogy.md capturing the shared principles (one idea per screen/slide; show don't tell; lead with the point; split, don't shrink; let visuals breathe), then have each of the three surfaces reference it, keeping only their medium-specific additions inline (course: hero visuals + text caps; deck: slide-splitting mechanics; briefing: verdict-first structure). Each skill keeps a one-sentence inline distillation as its graceful-degradation fallback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 lib/toolkit/pedagogy.md exists with the shared principles, written once
- [ ] #2 codebase-to-course, educate's deck template, and research's artifact-layer.md reference the module and keep only medium-specific rules inline
- [ ] #3 Each consuming surface retains a one-line inline distillation so guidance survives a missing lib/toolkit/
<!-- AC:END -->
