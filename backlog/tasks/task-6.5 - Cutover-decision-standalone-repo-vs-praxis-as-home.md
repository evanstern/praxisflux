---
id: TASK-6.5
title: 'Cutover decision: standalone repo vs praxis as home'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 18:48'
updated_date: '2026-07-09 18:59'
labels: []
dependencies: []
parent_task_id: TASK-6
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Slice 5 — needs Evan's decision, do not decide unilaterally. Once the plugin installs from the marketplace, the ~/.claude/skills/codebase-to-course symlink double-triggers. Options: (a) retire/archive the standalone repo, praxis becomes home; (b) keep standalone as upstream and vendor into praxis. Until decided, standalone repo stays untouched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Evan has chosen a cutover model and it is recorded
- [x] #2 The double-trigger is resolved (symlink removed or vendoring flow documented)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evan chose: praxis becomes home. Executed: removed ~/.claude/skills/codebase-to-course symlink (double-trigger resolved); standalone repo got an archive-notice README commit (9953efe), pushed, and was archived on GitHub (isArchived: true). The plugin must be installed from the marketplace for the skill to trigger again: /plugin marketplace add <praxis path> + /plugin install codebase-to-course@praxis.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cutover decided and executed: praxis is now codebase-to-course's home. Symlink removed, standalone repo pushed a final archive-notice commit and archived on GitHub (verified isArchived: true). Skill triggers only via the marketplace plugin from here on.
<!-- SECTION:FINAL_SUMMARY:END -->
