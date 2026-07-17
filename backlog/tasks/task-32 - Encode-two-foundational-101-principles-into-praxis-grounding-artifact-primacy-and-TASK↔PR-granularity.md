---
id: TASK-32
title: >-
  Encode two foundational (101) principles into praxis grounding:
  artifact-primacy and TASK↔PR granularity
status: To Do
assignee: []
created_date: '2026-07-17 14:13'
labels: []
dependencies: []
priority: high
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spike (design + encode; decide the durable home in praxis grounding). Two owner directives (2026-07-17) stated as "101 for Praxis and 101 for Coda" — foundational, and generic to ANY task system. They surfaced while working Coda (kofile/coda) and are drafted into Coda's v1.4.0 constitution amendment (specs/009-taint-architecture/contracts/constitution-amendment.md); this task carries the praxis-methodology half so every project praxis bootstraps inherits them.

Principle A — Artifact-grounded action (evidentiary primacy): the AI and the orchestrator NEVER do anything without leaving a durable paper trail AND/OR gating against real physical evidence in the project (a file, a git commit, a task/issue). Durable, programmatically-checkable artifacts that survive the SDLC for human review are the ONLY currency of state and decision — a choice living only in a chat turn, or a commitment left as prose where its durable home is the tracker, did not happen. Decisions are derived FROM artifacts and produce NEW artifacts; a question already answered by an existing artifact/principle is resolved from it, not re-asked as a preference. This is the general form the PDLC already gropes at (state-from-artifacts, verify-by-artifact, no-auto-advance).

Principle B — 1 TASK = 1 PR, with TASK vs SUBTASK distinguished, generic to any task system (Backlog.md, GitHub Issues, Jira, Spec Kit phases): a TASK is a top-level deliverable and maps 1:1 to a PR; a SUBTASK is internal work breakdown (dotted ids, parent links, checklist items, sub-issues) and NEVER gets its own PR — subtasks land as commits on the parent TASK's single branch and merge together in that TASK's one PR.

Decide where these live in praxis (the always-on PDLC CLAUDE.md grounding block planted by pdlc:bootstrap, and/or a praxis constitution/principles doc), encode them task-system-agnostically, and confirm downstream consumers (Coda) can reference the praxis statement rather than re-deriving it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Both principles are encoded in praxis's durable grounding (the pdlc bootstrap CLAUDE.md block and/or a praxis principles/constitution artifact), stated generically enough to hold under any task system
- [ ] #2 Principle A (artifact-primacy / paper-trail-or-gate) is worded as a general rule, not a Coda- or Backlog-specific one
- [ ] #3 Principle B (1 TASK = 1 PR; SUBTASK never gets its own PR) is worded task-system-agnostically with the TASK↔SUBTASK relationship as the invariant
- [ ] #4 The Coda v1.4.0 amendment references the praxis statement as the upstream source rather than duplicating the rationale
<!-- AC:END -->
