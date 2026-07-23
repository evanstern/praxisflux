---
id: TASK-35.2
title: Transplant team-review onto the chassis
status: To Do
assignee: []
created_date: '2026-07-23 05:16'
labels: []
dependencies: []
parent_task_id: TASK-35
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move ~/.claude/skills/team-review (v0.4.0) into team-review/ per the plugin shape in the parent task: plugin.json, skills/team-review/SKILL.md at v1.0.0, gates/review.mjs (unchanged domain logic), scripts/{run,orient,stop}.mjs + gate.sh, hooks/hooks.json, lib symlink. Swap the vendored stop-runner for lib/gate-runner.mjs runStopHook and adopt lib/cli.mjs runAsCli for the gate/run/orient CLIs. Template per the review: spec-bridge mechanics + pdlc installer toolkit; no lifecycle.mjs, no planted CLAUDE.md, gate stays in-skill. Vendor the iteration-3 review.md + process-log.md as spec input at the documented location.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Plugin dir matches the uniform convention; gates/ has zero write calls (greppable)
- [ ] #2 stop.mjs is a thin runStopHook entry; behavior identical (stdin contract, stop_hook_active, no-op with no runs in scope)
- [ ] #3 Skill runs end-to-end from a marketplace install against a sample target, target untouched
<!-- AC:END -->
