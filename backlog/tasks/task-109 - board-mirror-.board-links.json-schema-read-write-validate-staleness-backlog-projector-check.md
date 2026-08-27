---
id: TASK-109
title: >-
  board mirror: .board/links.json schema, read/write/validate, staleness,
  backlog projector, --check
status: To Do
assignee: []
created_date: '2026-08-27 16:14'
updated_date: '2026-08-27 16:15'
labels:
  - feature
  - chassis
  - spec-bridge
dependencies: []
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
