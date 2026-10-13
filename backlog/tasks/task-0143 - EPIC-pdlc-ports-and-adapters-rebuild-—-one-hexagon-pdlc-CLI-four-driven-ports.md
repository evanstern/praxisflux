---
id: TASK-0143
title: >-
  EPIC: pdlc ports-and-adapters rebuild — one hexagon, pdlc CLI, four driven
  ports
status: To Do
assignee: []
created_date: '2026-10-13 02:19'
labels:
  - epic
  - pdlc
  - chassis
  - feature
dependencies:
  - TASK-0138
  - TASK-0134
  - TASK-0139
  - TASK-0140
  - TASK-0141
  - TASK-0142
references:
  - >-
    backlog/decisions/decision-0002 -
    pdlc-rebuild-one-hexagon-—-a-pdlc-CLI-driving-port-and-four-driven-ports-Tracker-Forge-Spec-Harness.md
  - vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md
priority: high
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EPIC — grouping card, no PR of its own (docs/principles.md P2).

Rebuild pdlc so forges, trackers, spec writers and agent harnesses are swappable adapters behind ports. Design of record: decision-0002 (Accepted 2026-10-12) and vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md.

Constraints: adapters are scripted code verified by gates; skills route, they do not adapt. Assume only git, node and a POSIX shell. Every incumbent adapter (Backlog.md, GitHub, Spec Kit, Claude Code) behaves identically to today when its port lands.

Children (decision-0002 build order): TASK-0138 chassis -> TASK-0134 AGENTS.md -> TASK-0139 Harness port -> TASK-0140 Forge port -> TASK-0141 Tracker port -> TASK-0142 Spec port. Further adapters (gitlab, gitea, linear, github-issues) are carded one per PR once their port has landed.
<!-- SECTION:DESCRIPTION:END -->
