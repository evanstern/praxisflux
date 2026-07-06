---
id: TASK-1.9
title: Wire the ground-then-teach seam
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:27'
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
- [x] #1 'teach me X, research first, sources: ...' grounds then teaches, citing the grounding
- [x] #2 grounding scope (topic vs lesson) is chosen by applicability
- [x] #3 workflow degrades gracefully (inline grounding) when research is not installed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a 'Grounding — before teaching' section to educate lesson SKILL.md: scope the grounding (topic-scope topics/<topic>/research/ vs lesson-scope <lesson>/research/), consult topic-scope first then lesson-scope, hand off to the research plugin pointed at that folder, soft-dependency fallback to an inline WebSearch grounding pass into the same folder if research isn't installed, then teach citing the grounding. Add a one-line pointer in the planted educate CLAUDE.md. Mechanically verify a research vault bootstraps at both topic-scope and lesson-scope folders and passes the branch gate.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added a 'Grounding — before teaching' section to educate lesson SKILL.md and a pointer in the planted educate CLAUDE.md: scope selection (topic-scope topics/<topic>/research/ vs lesson-scope <lesson>/research/), consult topic-scope first then lesson-scope, hand off to the research plugin pointed at that folder, soft-dependency fallback to an inline WebSearch grounding pass into the same folder when research isn't installed, then teach citing the grounding. Mechanically verified: a research vault bootstraps and passes the branch gate at BOTH topics/demo/research and topics/demo/101-intro/research. 19/19 tests.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Ground-then-teach seam wired into educate's lesson skill: grounding happens before teaching, at topic- or lesson-scope (consult topic first), by handing off to the research plugin — with an inline WebSearch fallback when research isn't installed. Composes through files, not direct calls. Grounding-in-a-subfolder verified at both scopes via the research branch gate.
<!-- SECTION:FINAL_SUMMARY:END -->
