---
id: TASK-32
title: >-
  Encode two foundational (101) principles into praxis grounding:
  artifact-primacy and TASK↔PR granularity
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-17 14:13'
updated_date: '2026-07-17 14:20'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Design the durable home: canonical statement in a new docs/principles.md (praxis principles doc — the referenceable upstream artifact); operational form inherited by every bootstrapped project via pdlc/templates/CLAUDE.md 'Rules that always hold' (+ per-peer mapping lines).
2. Write docs/principles.md: Principle A (artifact-grounded action / evidentiary primacy) and Principle B (1 TASK = 1 PR; SUBTASK never gets its own PR), both task-system-agnostic, with rationale and per-system mapping table.
3. Encode concise forms in pdlc/templates/CLAUDE.md rules block; add mapping lines to the backlog + spec-kit peer blocks.
4. Sync repo surfaces: README Principles + Docs sections, root CLAUDE.md pointer; add template-content assertions to test/pdlc.test.mjs.
5. Bump marketplace version 0.7.0 -> 0.8.0 (released surface: pdlc/templates) via scripts/sync-version.mjs; run tests + bump gate.
6. Wiki pass: re-pin docs/wiki/pdlc-plugin.md (sources include pdlc/templates/CLAUDE.md) via wiki-update.
7. Coda side (AC#4): update specs/009-taint-architecture/contracts/constitution-amendment.md in the task-0003.01 worktree to cite praxisflux docs/principles.md as the upstream source instead of the 'flagged, praxis-side change pending' language; commit on that branch.
8. Per-task course docs/courses/TASK-32/, finalize (ACs, final summary, Done), PR from task-32-101-principles.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner refinements (2026-07-17, ratified while restructuring Coda's TASK-0003): (1) Reason-to-approve test — a PR exists only where it carries a stated reason for a human to approve (a policy ratified, a posture changed, a contract made binding); work items too small to give a reviewer a real decision merge into the deliverable they serve. (2) Three-tier model: EPIC groups deliverables, no PR of its own; TASK = deliverable, exactly 1 PR; SUBTASK = internal breakdown, never a PR. Worked example landed in Coda: TASK-0003 epic restructured to 7 deliverable TASKs (two merges: .06→.04 pre-PR checks pairing, .10→.08 quarantine surface); drafted into Coda's v1.4.0 amendment as a Principle V clarification (specs/009-taint-architecture/contracts/constitution-amendment.md on kofile/coda PR #9).
<!-- SECTION:NOTES:END -->
