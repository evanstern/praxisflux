---
id: TASK-108
title: >-
  Board-provider seam: one mirror interface for every ticketing system (Jira,
  Backlog.md, future)
status: Done
assignee: []
created_date: '2026-08-27 16:13'
updated_date: '2026-09-10 14:55'
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

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
EPIC CLOSED — no PR of its own (docs/principles.md P2). All five children Done and merged:

- TASK-109 (spec 052, the mirror seam) — PR merged, v0.59.0
- TASK-110 (spec 053, the bridge over the mirror) — #134, v0.59.6
- TASK-111 (spec 054, .board.json config + the jira peer) — #135, v0.59.3
- TASK-112 (spec 055, the verb table + renderJira) — #139, v0.62.0
- TASK-113 (spec 056, the Jira provider) — #140, merge fbe5b4c, v0.63.0

Delivered: the gate no longer depends on Backlog.md. .board/links.json is a
provider-neutral tracked mirror; providers is a registry keyed on requiresSync, where
the TYPE of project (function vs null) carries whether a node-only recompute exists.
Jira ships as the first non-Backlog provider, with its MCP-backed projection in a
skill so lib/ stays network-free (design invariant 4).

The operator ruling of 2026-08-27 — unify the mirror for ALL board types, not just
Jira — holds: backlog and jira are two entries in one registry, and the gate reads one
artifact shape for both.

One stated amendment along the way (spec 054, operator-ratified 2026-09-10): statusMap
stays bridge->site and injective; a new optional statusReadMap carries site->bridge
many-to-one, because a real workflow had fifteen statuses against the bridge three.

Residue carried forward, not rounded up: TASK-113 ACs #3 and #6 are unchecked — the
board-sync skill and the reverse direction are proven at the mechanism level but never
run end-to-end against a Jira-configured host, which praxisflux cannot be while
remaining a backlog host (invariant 2). See TASK-113 notes.
<!-- SECTION:FINAL_SUMMARY:END -->
