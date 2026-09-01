---
id: TASK-110
title: >-
  spec-bridge gate reads the mirror: provider-neutral verdicts, fail-closed on
  stale/missing board
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 16:14'
updated_date: '2026-09-01 14:33'
labels:
  - feature
  - gates
  - spec-bridge
dependencies:
  - TASK-109
priority: high
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Swap the bridge's INPUT, not its logic. boardLinks(root) becomes the single board-reading seam for checkBridge/verifyBridge/planBridge; resolveRoots stops meaning "has a backlog dir"; a stale or declared-but-missing mirror becomes a BLOCKING finding instead of a silent pass.

Backlog.md hosts see zero behavior change — the three existing test files must pass unedited.

Spec: specs/053-bridge-on-mirror
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 boardLinks(root) implements mirror-first / live-backlog / empty; all three entry points use it
- [ ] #2 backlog-only host produces byte-identical verdicts, messages, and planned commands
- [ ] #3 mirror-only host yields identical problems+warnings for equivalent state (differential fixture pair)
- [ ] #4 resolveRoots handles .board-only, backlog-only, and both; gates/cli.mjs resolves identically
- [ ] #5 stale requiresSync mirror yields one blocking problem naming reason and remedy
- [ ] #6 stale non-requiresSync mirror yields NO staleness problem (live projection preferred)
- [ ] #7 declared requiresSync provider with absent mirror yields the blocking no-evidence problem (asserted by message content)
- [ ] #8 planBridge returns structured intents for non-backlog providers; exact command strings for backlog
- [ ] #9 test/spec-bridge, test/project-gates, test/phase-status pass with NO edits to those files
- [ ] #10 New coverage for AC 3-8; docs/wiki re-pinned (spec-bridge-plugin, gates-convention, project-root)
- [ ] #11 Spec phase: Phase 1 — The seam and root resolution (behavior must not change)
- [ ] #12 Spec phase: Phase 2 — The fail-closed findings (new behavior, isolated)
- [ ] #13 Spec phase: Phase 3 — Planner split, differential proof, re-ground
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CLAIMED by sweep orchestrator 2026-09-01 (Lane 2, signed off; TASK-109 dep is Done). Branch task-110-bridge-on-mirror off origin/main tip 5a9fce0; worktree .claude/worktrees/task-110 (background-job mode). specs/053-bridge-on-mirror already carries a complete spec.md + plan.md + tasks.md on main (hand-authored under the runbook's operator-signed escape line), and the card already carried its Spec marker, so this claim commit carries the status flip + the three phase ACs seeded from tasks.md. TIER: sonnet · cc/claude-sonnet-5[1m] (defaultTier); the spec settles the judgment calls. Dispatch is phase-scoped: one fresh sonnet-implementer per phase (3 phases). NOTE for implementers: spec-bridge/gates/bridge.mjs contains a literal NUL byte at line 217 so plain grep prints NOTHING and exits 1 on it — always grep -a/-na. Spec 053 edits that file directly.
<!-- SECTION:NOTES:END -->
