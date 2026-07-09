---
id: TASK-7.4
title: Extract the shared visual-pedagogy principles into one lib/toolkit reference
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:28'
updated_date: '2026-07-09 20:52'
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
- [x] #1 lib/toolkit/pedagogy.md exists with the shared principles, written once
- [x] #2 codebase-to-course, educate's deck template, and research's artifact-layer.md reference the module and keep only medium-specific rules inline
- [x] #3 Each consuming surface retains a one-line inline distillation so guidance survives a missing lib/toolkit/
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
lib/toolkit/pedagogy.md written: five shared principles (one idea per screen/slide; show don't tell; lead with the point; split don't shrink; let visuals breathe), each distilled from the three independently-authored copies, plus a per-medium application map and the graceful-degradation one-liner. Consumers now reference it and keep only medium-specific rules: c2c content-philosophy.md intro names the shared core and scopes the file to course-specific hard rules (its 50%-visual/text-cap/hero-visual sections retained — they're medium-specific); educate's deck template header points at the module while keeping the deck-sized readability rules as its inline distillation; research artifact-layer.md step 2 notes 'lead with the verdict' is the briefing form of the shared pedagogy. base.html's sample callout already states the lead-with-the-point line and needed no change. Suite 39/39; sync-shared --check clean (deck header edit is outside the stamped regions).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The visual-teaching pedagogy is now written once in lib/toolkit/pedagogy.md (five principles + per-medium application map + fallback one-liner). The three surfaces that had each authored it independently — c2c's content-philosophy.md, educate's deck template header, research's artifact-layer.md — now reference the module and retain only their medium-specific rules plus a one-line inline distillation. 39/39 tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
