---
id: TASK-108
title: >-
  Board-provider seam: one mirror interface for every ticketing system (Jira,
  Backlog.md, future)
status: To Do
assignee: []
created_date: '2026-08-27 16:13'
updated_date: '2026-08-27 18:56'
labels:
  - epic
  - feature
  - pdlc
  - spec-bridge
dependencies:
  - TASK-102
  - TASK-107
  - TASK-104
priority: high
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EPIC — grouping card, no PR of its own (docs/principles.md P2).

Replace the gate's hardcoded Backlog.md dependency with a provider-neutral tracked mirror (.board/links.json), then ship Jira as the first non-Backlog provider. Design of record: docs/design/board-provider-seam.md.

Operator ruling 2026-08-27: unify the mirror for ALL board types, not just Jira — one pathway, one source of truth for tasks and where specs live.

Children: TASK-109 (052 seam) -> TASK-110 (053 bridge) / TASK-111 (054 config+peer) -> TASK-112 (055 verbs) -> TASK-113 (056 jira).
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PRE-SWEEP GATE (2026-08-27): deps on TASK-102/107/104 added after running the sweep's precondition gate. Full rationale on TASK-109 (the spine task carries the same deps, so the gate is transitive — TASK-110..113 all reach TASK-109). Order: TASK-102 first and alone (unblocks everything; TASK-105 also deps on it), then TASK-107's dispatch proof (~one session), then TASK-104. Not scope creep on this epic — these are host-readiness blockers that would have surfaced as a wedged sweep on the first phase commit.
<!-- SECTION:NOTES:END -->
