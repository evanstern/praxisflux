---
id: TASK-117
title: >-
  board mirror goes stale silently: regenerate .board/links.json at a gate choke
  point
status: To Do
assignee: []
created_date: '2026-09-08 15:34'
labels:
  - tech-debt
  - spec-bridge
  - gates
dependencies: []
ordinal: 148000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The bridge gate reads `.board/links.json` (TASK-110 / spec 053 made it provider-neutral by reading the mirror instead of `backlog/` directly). Nothing regenerates that mirror automatically, so it goes stale whenever anyone edits the board without remembering to recompute it.

Field case 2026-09-08 (TASK-116 sweep): the mirror's `generatedAt` was 2026-08-28 — eleven days old. The bridge gate faithfully reported five tasks whose board status "lagged their specs" (TASK-109/110/111 To Do or In Progress vs Done-eligible), all of which were ALREADY correct on the live board. Two sessions' worth of diagnosis went into chasing phantom board drift, and an orchestrator reported the wrong root cause once before finding it. `node lib/board-mirror.mjs --check --root .` names the disagreement in one run and was what finally settled it.

The mirror is derived state whose provider (`backlog`) is `requiresSync: false` — a deterministic recompute via `projectBacklog(root)`, no model needed. So there is no reason a human has to remember.

Two candidate fixes (pick one; do not do both):
1. Regenerate in the bridge gate's own precondition, so the gate never reads a stale artifact it could have refreshed itself.
2. Fail the pre-commit hook on a stale mirror, the way it already fails on version drift — making the staleness loud and local rather than silently misreported.

Option 1 is self-healing but hides drift; option 2 surfaces it but costs a manual step. Worth an explicit decision rather than defaulting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The backlog mirror can no longer be silently stale when the bridge gate reads it — either the gate regenerates it in its precondition or a hook fails on staleness (decision recorded)
- [ ] #2 A stale mirror is distinguishable from real board drift in the gate's own output, so a session cannot chase phantom findings
- [ ] #3 Regression test pins the chosen mechanism: a deliberately stale mirror produces the intended outcome (refresh or block), not misleading status findings
<!-- AC:END -->
