---
id: TASK-6.6
title: 'Skill content tweaks: screen bounds, multi-course proposal, quiz coverage rule'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:13'
updated_date: '2026-07-10 14:59'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pre-e2e refinements to the codebase-to-course skill: (1) screens per module are 3-6 on average with hard bounds 1-10; (2) loosen the 'do NOT present the curriculum' rule — after the initial digest the skill SHOULD propose options when the codebase is large enough to warrant multiple courses, otherwise build straight through; (3) quizzes may only use terms/concepts already covered earlier in the lesson (application to new situations is fine, but every term and concept referenced must be guaranteed taught before the quiz). Rule 3 must live in references/content-philosophy.md, since module-writing agents receive that file, not SKILL.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md states 3-6 screens on average per module with explicit lower bound 1 and upper bound 10
- [x] #2 SKILL.md keeps build-without-approval as the default but directs proposing course options after the initial digest when the codebase warrants multiple courses
- [x] #3 Quiz coverage rule (only previously covered terms/concepts) is stated in both SKILL.md and references/content-philosophy.md
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Coverage rule placed in content-philosophy.md (the file writing agents actually receive) with a pointer from SKILL.md's mandatory-elements bullet. It's compatible with the existing 'nothing answerable by scrolling up and copying' rule: coverage constrains vocabulary, not literal answers. Grep confirmed no other conflicting screen-count text.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Three skill refinements: per-module screens now 3-6 on average with hard bounds 1-10 (no padding/cramming); build-without-approval kept as default but the skill proposes course options after the initial digest when a codebase warrants multiple courses; quizzes gained a hard coverage rule (every term/concept/actor must be taught before the quiz; applying to new situations still encouraged) in both SKILL.md and content-philosophy.md. Pre-commit checks green; pushed to PR #3.
<!-- SECTION:FINAL_SUMMARY:END -->
