---
id: TASK-109
title: >-
  board mirror: .board/links.json schema, read/write/validate, staleness,
  backlog projector, --check
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-08-27 18:56'
labels:
  - feature
  - chassis
  - spec-bridge
dependencies:
  - TASK-102
  - TASK-107
  - TASK-104
priority: high
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce lib/board-mirror.mjs — the tracked board interface every provider projects into, so the gate stops knowing what a board is.

Today findLinkedTasks() scans backlog/tasks/*.md and bridgeGate.resolveRoots keys on hasChild("backlog"), so a Jira-only host resolves zero roots and the Stop hook SILENTLY passes with nothing checked. This spec makes the mirror exist and be trustworthy.

Contract-shaped: goes first, unblocks TASK-110 and TASK-111.

Spec: specs/052-board-adapter-seam
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Schema documented and implemented with unknown keys round-tripping intact
- [ ] #2 readMirror returns null for absent and THROWS for malformed JSON or unknown schema
- [ ] #3 writeMirror is byte-deterministic; links sort naturally (TASK-9 before TASK-10)
- [ ] #4 validateMirror catches missing field, wrong type, duplicate id, duplicate specDir, non-monotonic ac index
- [ ] #5 mirrorStaleness returns stale+reason for non-ancestor sha, absent sha on requiresSync, and non-git root
- [ ] #6 backlog projector matches findLinkedTasks('.') entry-for-entry on id/status/specDir/acs
- [ ] #7 parseLinkedTask and the tasks-dir scan MOVED to lib/board-mirror.mjs; bridge.mjs re-exports; all import sites resolve
- [ ] #8 --check exits nonzero on a hand-edited backlog mirror naming the drifted id; 0 when fresh; 0 when absent
- [ ] #9 test/spec-bridge, test/project-gates, test/phase-status pass with NO edits to those files
- [ ] #10 test/board-mirror.test.mjs covers AC 2-8; docs/wiki re-pinned for every touched source
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PRE-SWEEP GATE (2026-08-27, readiness check before sweeping TASK-109..113). Deps on TASK-102/107/104 are sweep-blockers found by running the sweep's own precondition gate, not scope:

(1) TASK-102 — HARD BLOCKER, verified concretely. core.hooksPath is active; .githooks/pre-commit runs full 'node --test', which includes test/run-gates.test.mjs:20 asserting the repo passes wiki-freshness. docs/wiki/spec-bridge-plugin.md pins spec-bridge/gates/bridge.mjs, which spec 053 Phase 1 edits. So commit 1 of that phase stales the note, turns node --test red, and pre-commit blocks EVERY subsequent commit until the re-pin — which doctrine sequences last. Unsatisfiable. Specs 052/053/054/055 each touch pinned sources across multiple phases, so this fires early and repeatedly. Same mechanism TASK-102 records behind the specs/048 field case ('254 pass, 0 fail' reported while four notes were staled).

(2) TASK-107 — tier pins unproven at the harness. tiers.mjs --check exits 0, but that proves the FILES say the right model, not that it served. TASK-106 finding 3: haiku-implementer dispatched 'agent type not found'; opus-implementer served its PRE-regeneration pin. Sweep doctrine: a wrong pin caught after one agent is a rounding error, after a lane it is the lane's budget. This is a 5-task lane.

(3) TASK-104 — gate blind to branch-local spec dirs. These five spec dirs are on main so they resolve today, but the sweep's claim protocol authors each spec ON A BRANCH; the gate reads from root and reports the task as exceeding its artifacts. Recommended before sweeping, less severe than (1).

Also noted, not blocking: no scripts/check-merge-drift.mjs on this host (sweep falls back to raw git; loses claim-collision + drift matrix). A prunable worktree from 2026-07-31 points at /Users/evanstern/neumo/projects/praxis/ — verify dead, then 'git worktree prune'.
<!-- SECTION:NOTES:END -->
