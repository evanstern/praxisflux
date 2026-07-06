---
id: TASK-1.7
title: Standardize the handoff protocol (transport)
status: Done
assignee: []
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 19:22'
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
- [x] #1 handoff payloads live in gitignored .handoff/ and leave a clean git status
- [x] #2 the gate reads handoff evidence from tracked progress.json, not from loose .md files
- [x] #3 payload schemas are declared per plugin pair, not by the chassis
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added lib/handoff.mjs: gitignored .handoff/ transport (writeHandoff/readHandoff/listHandoffs/markConsumed), opaque markdown payloads with an id/kind/from/to/ref envelope, ensureGitignore('.handoff/'), consume moves to .handoff/consumed/. Payload schema is per plugin pair, not chassis. Rewired educate DoD: removed handoff/postBuild from required FILE artifacts; added a progress.json evidence check (handoff.returned at >=built, handoff.foldedIn at done) — the gate reads tracked state, not loose files. Added lesson.handoff object to progress.schema.json. Wrote docs/handoff-protocol.md. 17/17 tests pass; real project (~/Claude/Projects/Education, no delegatedBuild) still clean; schema valid JSON.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Handoff protocol transport standardized in lib/handoff.mjs: transient payloads in a gitignored .handoff/ (clean git status), durable evidence in tracked progress.json (the gate reads it, not loose files), payload schemas per plugin pair. educate's DoD now reads handoff.returned/foldedIn evidence instead of requiring HANDOFF.md/POST_BUILD_HANDOFF.md files. Documented in docs/handoff-protocol.md.
<!-- SECTION:FINAL_SUMMARY:END -->
