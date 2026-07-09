---
id: TASK-6.6
title: 'Skill content tweaks: screen bounds, multi-course proposal, quiz coverage rule'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-09 19:13'
updated_date: '2026-07-09 19:13'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evan's pre-e2e refinements to the codebase-to-course skill: (1) screens per module are 3-6 on average with hard bounds 1-10; (2) loosen the 'do NOT present the curriculum' rule — after the initial digest the skill SHOULD propose options when the codebase is large enough to warrant multiple courses, otherwise build straight through; (3) quizzes may only use terms/concepts already covered earlier in the lesson (application to new situations is fine, but every term and concept referenced must be guaranteed taught before the quiz). Rule 3 must live in references/content-philosophy.md, since module-writing agents receive that file, not SKILL.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SKILL.md states 3-6 screens on average per module with explicit lower bound 1 and upper bound 10
- [ ] #2 SKILL.md keeps build-without-approval as the default but directs proposing course options after the initial digest when the codebase warrants multiple courses
- [ ] #3 Quiz coverage rule (only previously covered terms/concepts) is stated in both SKILL.md and references/content-philosophy.md
<!-- AC:END -->
