---
id: TASK-6.4
title: Course output gate on the chassis (gates/course.mjs)
status: To Do
assignee: []
created_date: '2026-07-09 18:48'
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
- [ ] #1 gates/course.mjs checks: index.html exists, self-contained (Google Fonts allowed), nav dots == module count, per-module quiz + code translation, course-level group chat + flow animation
- [ ] #2 cli.mjs course <course-dir> runs the gate and reports pass/fail
- [ ] #3 SKILL.md Phase 4 invokes the gate as its output gate
- [ ] #4 Tests in test/ cover pass and fail cases against a minimal fixture course
<!-- AC:END -->
