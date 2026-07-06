---
id: TASK-1.7
title: Standardize the handoff protocol (transport)
status: To Do
assignee: []
created_date: '2026-07-06 17:06'
labels:
  - handoff
  - chassis
dependencies:
  - TASK-1.2
  - TASK-1.4
parent_task_id: TASK-1
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generalize the ENVELOPE, not the semantics: gitignored .handoff/ payloads (installer adds the ignore), a request+response shape, evidence recorded in tracked state (progress.json) rather than loose files, and a consume-then-fold lifecycle. Payload SCHEMAS stay plugin-specific (e.g. educate's SPEC + findings). Leaves git status clean while keeping the gate enforceable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 handoff payloads live in gitignored .handoff/ and leave a clean git status
- [ ] #2 the gate reads handoff evidence from tracked progress.json, not from loose .md files
- [ ] #3 payload schemas are declared per plugin pair, not by the chassis
<!-- AC:END -->
