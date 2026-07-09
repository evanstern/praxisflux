---
id: TASK-6.3
title: Default course output to docs/course/ in the target repo
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 18:48'
updated_date: '2026-07-09 18:52'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Slice 3. Courses default to docs/course/ inside the target repo (standing layout: grounding at docs/wiki/, courses at docs/course/), overridable when the user names a destination.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md specifies docs/course/ as the default output location
- [x] #2 A user-named destination overrides the default
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SKILL.md Phase 3 now names docs/course/ inside the target repo as the default output directory (pairing with docs/wiki/), with a user-named destination taking precedence. Pre-commit checks green.
<!-- SECTION:FINAL_SUMMARY:END -->
