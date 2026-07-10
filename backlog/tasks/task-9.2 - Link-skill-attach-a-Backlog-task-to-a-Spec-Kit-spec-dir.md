---
id: TASK-9.2
title: 'Link skill: attach a Backlog task to a Spec Kit spec dir'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 02:26'
updated_date: '2026-07-10 03:03'
labels: []
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
priority: medium
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skill that creates (or attaches to) a Backlog task for a given specs/NNN-feature/ dir. Plants a deterministic marker the sync and gate can find (e.g. 'Spec: specs/NNN-feature/' line in the task description or a spec:NNN label). Seeds the task's acceptance criteria from the current tasks.md phases via the derivation module. All Backlog writes go through the backlog CLI (never hand-edit task files).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Linking creates or updates a Backlog task carrying a machine-findable spec-dir marker
- [x] #2 The task's ACs mirror the spec's current tasks.md phases at link time
- [x] #3 Linking an already-linked spec dir is idempotent (no duplicate tasks or ACs)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold spec-bridge/ plugin (plugin.json, README, marketplace.json entry via gen-marketplace)
2. gates/bridge.mjs (read-only): parseLinkedTask (frontmatter status + 'Spec: <dir>' marker line in description), findLinkedTasks(root) over backlog/tasks/*.md
3. gates/cli.mjs: 'state <specDir>' (derived JSON via lib/spec-derive) + 'links <root>' (linked tasks with derived state + verdict) — the deterministic backbone the skills call
4. skills/link/SKILL.md in gate->work->gate shape: precondition (backlog CLI + spec dir exist), idempotency via cli links, create/update via backlog CLI only, marker in description, seed 'Spec phase: <name>' ACs from derived phases, status To Do/In Progress from derivation
5. Tests: parse/find/verdict units on tmp fixtures; suite green
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
spec-bridge/ scaffolded (plugin.json, marketplace.json entry via gen-marketplace; versions in sync). gates/bridge.mjs: parseLinkedTask/findLinkedTasks read the 'Spec: <dir>' description marker + frontmatter status (read-only — all writes stay in the backlog CLI). gates/cli.mjs: state/links/check as the skills' deterministic backbone. skills/link/SKILL.md in gate->work->gate shape: idempotency via 'cli.mjs links' (update mode, never a second task), marker planted through backlog CLI create/edit, phase ACs seeded as 'Spec phase: <name>' from cli state, starting status capped at In Progress (Done is sync's). AC1-3 are prescribed deterministically by the skill's cli backbone and pinned by tests (marker parse, links discovery); live end-to-end skill run is verified at the epic level. Suite green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the spec-bridge plugin scaffold + link skill: gates/bridge.mjs (marker/status reader), gates/cli.mjs (state/links/check), skills/link/SKILL.md (idempotent link via backlog CLI, phase-AC seeding, honest starting status). Verified with test/spec-bridge.test.mjs fixtures + live cli smoke; suite green.
<!-- SECTION:FINAL_SUMMARY:END -->
