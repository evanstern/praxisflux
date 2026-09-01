---
id: TASK-108
title: >-
  Open Brain grounding gate: query captured cross-project decisions before spec
  authoring
status: To Do
assignee: []
created_date: '2026-08-31 19:31'
updated_date: '2026-08-31 19:33'
labels:
  - pdlc
  - doctrine
dependencies: []
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evan's known failure mode (his words, 2026-08-31): 'I forget design decisions until they conflict with new work, and the AI doesn't catch it either.' The store half of the fix already exists — Open Brain (MCP) holds cross-project decisions, constraints, and gotchas that no single repo's wiki owns (e.g. a hosting-wide routing policy that every service on the homelab must follow). What's missing is the enforcement half: nothing in the PDLC makes a session look there before a spec hardens assumptions that a captured decision already contradicts.

Fix: add a pre-spec grounding step to the spec-authoring path — before drafting spec.md for a task, query Open Brain for decisions/constraints relevant to the project and the task's subject, and surface any hits in the spec's context (or explicitly note 'no captured constraints found'). Surfaces that author specs: pdlc:sweep's per-task Spec Kit cycle (step 3 of the task loop) and pdlc:design-rounds' post-selection spec authoring.

Doctrine constraints: plugins compose through files and gates, so this is skill prose instructing the session to query the MCP tools when present — not a runtime dependency on Open Brain. Sessions without the OB MCP server (CI, other machines) must degrade cleanly: the step is 'query if available, note unavailability if not', never a hard failure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The sweep skill's per-task spec-authoring step instructs querying Open Brain (when the MCP tools are present) for decisions/constraints relevant to the project and task before drafting spec.md, and recording hits or their absence in the spec
- [ ] #2 design-rounds' spec-authoring step carries the same instruction
- [ ] #3 Absence of the Open Brain MCP server degrades to a noted skip, never a failure — verified by the skill prose stating it and no runtime/gate dependency added
- [ ] #4 Wiki re-pinned if any note lists the touched skill files as sources; gates green
<!-- AC:END -->
