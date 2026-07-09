---
id: TASK-7.7
title: >-
  Borrowing seam: package educate's SVG-diagram guidance as an optional toolkit
  module
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:29'
updated_date: '2026-07-09 20:53'
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
- [x] #1 lib/toolkit/svg-diagrams.md exists with the SVG authoring rules and pitfalls
- [x] #2 educate's deck template references the module, keeping only slide-specific rules inline plus a fallback distillation
- [x] #3 codebase-to-course and research's artifact-layer.md point to the module as optional guidance for inline SVG
- [x] #4 All three plugins still pass their gates
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write lib/toolkit/svg-diagrams.md: the hard-won inline-SVG rules from educate's deck template (tspan not <b>/<i> inside <text>; CSS var() does NOT resolve in SVG presentation attributes -> literal values, so pick colors that read on both themes or give the figure a contrasting panel; width:100%/height:auto + viewBox; role=img + aria-label; arrow marker-end def pattern), a layout rule tying to pedagogy.md ('let visuals breathe' -> own slide / full-width block), a skeleton example (the deck template's Input->Process->Output flow), and the fallback distillation.
2. deck.html header keeps its one-line rule (inline distillation) + gains the module pointer.
3. c2c interactive-elements.md Flow Diagrams section: one line — prefer the HTML/CSS patterns; for hand-drawn inline SVG follow lib/toolkit/svg-diagrams.md.
4. research artifact-layer.md step 4 (draw charts with inline SVG): pointer to the module for SVG authoring pitfalls.
5. Suite + sync --check; finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
lib/toolkit/svg-diagrams.md written: five hard rules (tspan not <b>/<i> inside SVG <text>; var() doesn't resolve in SVG presentation attributes -> literal, both-theme-legible colors or a contrasting panel; viewBox + width:100%/height:auto; role=img + aria-label; give-the-figure-room per shared pedagogy), the boxes-and-arrows skeleton lifted from the deck template's sample slide (with the marker-def arrowhead pattern + unique-id note), a per-plugin usage map, and the two-rule fallback distillation. Pointers added: deck template header (keeps its one-line rule inline, gains the module reference), c2c interactive-elements.md Flow Diagrams intro (prefer HTML/CSS patterns; SVG when needed follows the module), research artifact-layer.md step 4. Suite 39/39, sync --check clean (header edits are outside stamped regions).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
educate's hard-won inline-SVG authoring rules are now the shared lib/toolkit/svg-diagrams.md module (pitfalls, skeleton with arrow-marker pattern, accessibility, layout rule), referenced from educate's deck template, codebase-to-course's Flow Diagrams section, and research's artifact-layer.md — each keeping a one-line inline distillation. 39/39 tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
