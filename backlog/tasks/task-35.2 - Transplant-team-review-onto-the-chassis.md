---
id: TASK-35.2
title: Transplant team-review onto the chassis
status: Done
assignee:
  - '@claude'
created_date: '2026-07-23 05:16'
updated_date: '2026-07-23 16:31'
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
- [x] #1 Plugin dir matches the uniform convention; gates/ has zero write calls (greppable)
- [x] #2 stop.mjs is a thin runStopHook entry; behavior identical (stdin contract, stop_hook_active, no-op with no runs in scope)
- [x] #3 Skill runs end-to-end from a marketplace install against a sample target, target untouched
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create team-review/ plugin dir: .claude-plugin/plugin.json (version lockstep 0.8.0 until the 35.3 bump), skills/team-review/SKILL.md v1.0.0 (content from ~/.claude/skills/team-review v0.4.0, paths on ${CLAUDE_PLUGIN_ROOT}), gates/review.mjs (domain logic unchanged; reviewGate becomes a constant gate whose resolveRoots derives runsDirFor(startDir) so it drops into the shared runner; CLI guard -> lib/cli.mjs runAsCli), scripts/run.mjs + orient.mjs (runAsCli-guarded CLIs, logic unchanged), scripts/stop.mjs (thin runStopHook entry), scripts/gate.sh + hooks/hooks.json (as source), lib -> ../lib symlink, README.md.
2. Vendor spec input at docs/handoffs/team-review-iteration-3-review.md + -process-log.md; point to it from team-review/README.md.
3. Register via gen-marketplace (now generative) so the catalog test stays green.
4. E2E: build dist/ (marketplace-install form, lib dereferenced), run begin -> write report -> finish against a sample target repo; verify target byte-for-byte untouched and grep-prove gates/ has zero write calls.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Transplant complete. gates/review.mjs: domain logic (runsDirFor/gitSnapshot/citations/checkReview) unchanged; reviewGate refactored from a factory to a constant gate whose resolveRoots derives runsDirFor(startDir), so stop.mjs is a 3-line runStopHook entry; the finish/abandon guidance moved into check() so the blocked-Stop message stays actionable. run.mjs/orient.mjs CLI bodies guarded by lib/cli.mjs runAsCli, logic unchanged. gate.sh + hooks.json carried over verbatim. Write-free gates proven by grep (writeFileSync/mkdirSync/rmSync/renameSync/etc: zero hits). E2E from dist/team-review (marketplace-install form, lib dereferenced): begin -> stop hook blocks with guidance (exit 2) -> report -> finish (exit 0) -> stop hook allows; stop_hook_active honored (exit 0 mid-run); no-op outside scope; sample target byte-for-byte untouched (clean porcelain, same HEAD). Spec input vendored at docs/handoffs/team-review-iteration-3-{review,process-log}.md, pointed to from team-review/README.md. Registered via generative gen-marketplace; README row + install line added (check-docs demanded them at this slice, not 35.3). Wiki notes skill-patterns/gates-convention/build-and-release re-verified + re-pinned to 8edd7fb per wiki-update plan.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved ~/.claude/skills/team-review v0.4.0 into team-review/ as a chassis plugin (plugin.json 0.8.0 lockstep, skill v1.0.0, gates/scripts/hooks/lib-symlink per the uniform convention, spec-bridge mechanics, no lifecycle, no planted CLAUDE.md, gate in-skill). Vendored stop-runner replaced by lib/gate-runner.mjs runStopHook via a constant reviewGate; CLIs adopted lib/cli.mjs runAsCli. Iteration-3 spec input vendored at docs/handoffs/. Verified: full suite 127 pass, gates/ grep-proven write-free, and an end-to-end begin -> review -> finish run from the built dist against a sample git target left the target untouched with the Stop hook blocking/allowing correctly.
<!-- SECTION:FINAL_SUMMARY:END -->
