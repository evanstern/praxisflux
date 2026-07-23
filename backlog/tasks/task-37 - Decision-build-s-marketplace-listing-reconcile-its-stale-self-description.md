---
id: TASK-37
title: 'Decision: build/''s marketplace listing + reconcile its stale self-description'
status: To Do
assignee: []
created_date: '2026-07-23 16:59'
labels: []
dependencies: []
priority: low
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-35's vendored spec input (docs/handoffs/team-review-iteration-3-review.md, 'What should be removed' + open question 1): build/ is a discoverable marketplace entry whose own README still opens 'Scaffold — not yet implemented', and the repo README row echoes '(scaffold — split out of educate)'. Since that review pinned e2a99b9, TASK-29 shipped the real implement skill (build/skills/), so the stub claim is stale — but the plugin still has no gates/, scripts/, or hooks/. Decide: (a) keep it listed as a skill-only plugin (legitimate per the pdlc precedent of opting out of lifecycle machinery) and fix both READMEs to describe what actually ships, or (b) delist it from the marketplace until it carries its own gate surface. Either branch must leave the catalog, README, and build/README.md telling one consistent story. If the outcome is decision-plus-doc-fixes only, note the task-courses decision-only exemption boundary: README edits are artifacts, so a per-task course is still due.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The decision (keep-listed vs delist) is recorded in the task with rationale referencing the review's open question
- [ ] #2 build/README.md no longer claims 'not yet implemented' anything that TASK-29 shipped; the repo README row matches
- [ ] #3 Marketplace catalog, check-docs, and version bump (per docs/releasing.md if released surface changes) all green after the change
<!-- AC:END -->
