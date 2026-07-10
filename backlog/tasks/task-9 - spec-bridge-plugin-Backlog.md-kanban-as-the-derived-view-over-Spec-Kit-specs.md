---
id: TASK-9
title: 'spec-bridge plugin: Backlog.md kanban as the derived view over Spec Kit specs'
status: To Do
assignee: []
created_date: '2026-07-10 02:26'
labels: []
dependencies: []
priority: medium
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A new praxis plugin bridging GitHub Spec Kit and Backlog.md through files + gates (no fork of either tool). One Backlog task per Spec Kit spec dir (specs/NNN-feature/); the task's acceptance criteria mirror Spec Kit's tasks.md phases; status is a ONE-WAY DERIVATION from spec artifacts (spec.md/plan.md/tasks.md checkboxes), never hand-set. Files are the source of truth; Backlog is the view. A chassis gate enforces the house rule: a linked task's Backlog status can't exceed its derived status. Rationale + design discussion: brainstorm session 2026-07-09. Open question carried in scope: Spec Kit's branch-per-feature means the task file lives on the feature branch until merge — acceptable for now (kanban pinned to branch), revisit if it chafes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 spec-bridge is registered in marketplace.json and independently installable
- [ ] #2 A spec dir can be linked, synced, and gate-enforced end to end on a real Spec Kit project
- [ ] #3 docs/skill-patterns.md or plugin README documents the derivation rules and the one-way-sync contract
<!-- AC:END -->
