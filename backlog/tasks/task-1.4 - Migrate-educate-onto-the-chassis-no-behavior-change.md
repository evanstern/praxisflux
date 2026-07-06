---
id: TASK-1.4
title: Migrate educate onto the chassis (no behavior change)
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:09'
labels:
  - educate
  - chassis
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Re-host educate on lib/: progress.mjs uses the shared lifecycle/project-root modules; gate.sh becomes a thin shim over gate-runner; reference lib via CLAUDE_PLUGIN_ROOT. Pure refactor - existing educate projects must gate identically.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 progress --sync/--check/--gate behavior is preserved on existing projects
- [x] #2 gate.sh delegates to the shared gate-runner
- [x] #3 educate references shared modules from lib/, not private copies
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Copy educate skills/hooks/scripts/templates/package.json/spec into praxis/educate/ (cp -R, dotfile-safe). Refactor scripts/progress.mjs to use lib/project-root (findRootUpwards for topics/) + lib/lifecycle (createLifecycle for the done/decked artifact checks), keeping CLI (--sync/--check/--gate/--all/--root) and outcomes identical; export gateProblemsForProject(root). Add hooks/stop.mjs using lib/gate-runner + an educate gate; gate.sh becomes a thin shim (exec node stop.mjs). Parity-check original vs new progress.mjs --check/--gate against the real project ~/Claude/Projects/Education. Commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Copied educate skills/hooks/scripts/templates into praxis/educate/. Refactored scripts/progress.mjs onto lib: findRootUpwards(hasChild('topics')) for root resolution; createLifecycle(STATES, ARTIFACT_FILES, requires) for the done/decked DoD checks; today() for the updated stamp. Added scripts/stop.mjs (runStopHook + an educate gate) and reduced gate.sh to 'exec node stop.mjs'. PARITY: old vs new progress.mjs produce IDENTICAL output + exit codes for --all --check and --all --gate on the real project ~/Claude/Projects/Education. Stop hook verified: clean project exit 0, non-educate dir exit 0, stop_hook_active loop-guard exit 0, premature done (missing deck/guide) exit 2 with messages via both stop.mjs and gate.sh.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
educate migrated onto the chassis with no behavior change. progress.mjs now uses lib/project-root + lib/lifecycle + lib/dates; gate.sh is a shim over scripts/stop.mjs -> lib/gate-runner. Output is byte-identical to the original on the real project (~/Claude/Projects/Education) for --check and --gate, and the Stop hook correctly allows/no-ops/blocks. 12/12 tests pass.
<!-- SECTION:FINAL_SUMMARY:END -->
