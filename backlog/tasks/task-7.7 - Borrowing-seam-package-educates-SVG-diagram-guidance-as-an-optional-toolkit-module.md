---
id: TASK-7.7
title: >-
  Borrowing seam: package educate's SVG-diagram guidance as an optional toolkit
  module
status: To Do
assignee: []
created_date: '2026-07-09 19:29'
labels: []
dependencies:
  - TASK-7.1
parent_task_id: TASK-7
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
educate owns the hand-drawn inline-SVG diagram discipline (deck.html: diagram on its own slide, never <b>/<i> inside SVG <text> — use <tspan>, CSS var(--...) does not resolve in SVG attributes so use literal values, let diagrams breathe). These hard-won SVG pitfalls apply to any plugin emitting inline SVG — codebase-to-course pages and research briefings included (research already emits SVG charts via dataviz). Extract the guidance into lib/toolkit/svg-diagrams.md and reference it from educate's deck template; add opt-in pointers from codebase-to-course and research's artifact-layer.md where inline SVG is discussed. educate keeps its slide-specific rules inline and remains fully functional without the module.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 lib/toolkit/svg-diagrams.md exists with the SVG authoring rules and pitfalls
- [ ] #2 educate's deck template references the module, keeping only slide-specific rules inline plus a fallback distillation
- [ ] #3 codebase-to-course and research's artifact-layer.md point to the module as optional guidance for inline SVG
- [ ] #4 All three plugins still pass their gates
<!-- AC:END -->
