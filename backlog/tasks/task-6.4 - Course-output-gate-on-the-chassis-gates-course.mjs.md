---
id: TASK-6.4
title: Course output gate on the chassis (gates/course.mjs)
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 18:48'
updated_date: '2026-07-10 22:17'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Slice 4. gates/course.mjs + cli.mjs course <course-dir>, read-only per the gates/ convention: built index.html exists and is self-contained via lib/selfcontained.mjs (Google Fonts the one allowed external), nav dots == module count, every module has >=1 quiz and >=1 code translation block, course includes >=1 group chat and >=1 flow animation. Wire into SKILL.md Phase 4 as the output gate. Tests in test/ against a minimal fixture course.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 gates/course.mjs checks: index.html exists, self-contained (Google Fonts allowed), nav dots == module count, per-module quiz + code translation, course-level group chat + flow animation
- [x] #2 cli.mjs course <course-dir> runs the gate and reports pass/fail
- [x] #3 SKILL.md Phase 4 invokes the gate as its output gate
- [x] #4 Tests in test/ cover pass and fail cases against a minimal fixture course
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read lib/selfcontained.mjs + grounding-wiki/gates/{freshness,cli}.mjs as the pattern
2. Write codebase-to-course/gates/course.mjs (read-only): index.html exists, self-contained (Google Fonts allowlisted), nav dots == module count, per-module >=1 quiz + >=1 code translation, course-level >=1 group chat + >=1 flow animation
3. Write codebase-to-course/gates/cli.mjs (course <course-dir>)
4. Wire the gate into SKILL.md Phase 4 as the output gate
5. test/codebase-to-course.course-gate.test.mjs with a minimal fixture course (pass + each failure mode)
6. node --test green, commit
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Gate + CLI follow the grounding-wiki gates/ pattern (read-only, ../../lib import rewritten by build.mjs — verified by running the dist copy). Quiz = any of quiz-container/dnd-container/bug-challenge/scenario-block. Google Fonts masked before checkHtml. Sanity-checked against the real reference-repo course: passes with 6 modules.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added codebase-to-course/gates/course.mjs + cli.mjs (course <course-dir>): read-only output gate checking existence, self-containment (Google Fonts allowlisted), nav-dot/module parity, per-module quiz + translation, course-wide chat + flow animation. Wired into SKILL.md Phase 4 with a fix-until-green instruction. 6 fixture tests pass; gate also passes on the reference repo's real course from both source and vendored dist.
<!-- SECTION:FINAL_SUMMARY:END -->
