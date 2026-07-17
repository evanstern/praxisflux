# praxis principles — the foundational ("101") rules

The praxis development lifecycle rests on a small set of foundational principles. They are
**methodology rules, not tool rules**: each is stated generically enough to hold under any
task system (Backlog.md, GitHub Issues, Jira, Spec Kit phases) and any project, and each is
inherited by every project that runs `pdlc:bootstrap` — the planted always-on grounding
carries their operational form, and this document is the canonical statement.

This document is the **upstream source** for downstream restatements. A project that adopts
these rules in its own governance artifact (a constitution, a contributing guide, house
rules) should reference this document and add only its domain-specific application — not
re-derive or duplicate the rationale. (First such consumer: Coda's constitution v1.4.0,
Principle VIII, which applies P1 to a pipeline product and adds deterministic-gatekeeping
enforcement on top.)

Provenance: owner directives (2026-07-17), stated as foundational — "101" — for both the
methodology (praxis) and its consuming projects; encoded by TASK-32.

## P1 — Artifact-grounded action (evidentiary primacy)

**Neither the AI nor the orchestrator ever does anything without leaving a durable paper
trail and/or gating against real physical evidence in the project** — a file, a git commit,
a task or issue in the tracker.

Durable, programmatically-checkable artifacts that survive the SDLC for human review are
the **only currency of state and decision**:

- A choice that lives only in a chat turn **did not happen**. A commitment left as prose in
  some other document, when its durable home is the tracker, **did not happen**. If work is
  committed, it is a task on the board; if a decision is made, it lands in an artifact that
  outlives the conversation.
- **Decisions are derived FROM artifacts and produce NEW artifacts.** State is read from
  what exists (files, commits, board entries), never from a caller's or a model's claim;
  acting on a decision leaves new evidence behind.
- **A question already answered by an existing artifact or principle is resolved from it,
  not re-asked as a preference.** Asking the human something the plan of record already
  determines is a failure of grounding, not politeness.

This is the general form of rules the PDLC already applies in specific places: state is
derived from artifacts, done-ness is verified by artifact (gates — "a status can never
exceed the artifacts that prove it"), and nothing auto-advances across a human gate. Those
are applications; P1 is the principle they instantiate.

## P2 — One TASK, one PR (work-breakdown granularity)

Every task system distinguishes, by whatever name, two levels of work. The invariant is the
relationship between them:

- A **TASK** is a top-level deliverable — a unit of committed, reviewable work. **A TASK
  maps 1:1 to a pull request**: one TASK, one branch, one PR that lands it.
- A **SUBTASK** is internal work breakdown *of* a TASK — however the system spells it:
  dotted ids or parent links (Backlog.md), sub-issues or checklist items (GitHub Issues),
  sub-tasks (Jira), phases within a spec (Spec Kit). **A SUBTASK never gets its own PR.**
  Subtasks land as commits on the parent TASK's single branch and merge together in that
  TASK's one PR.

Consequences, independent of tooling:

- The PR is the review boundary, and the review boundary is the deliverable boundary.
  Review happens at the level a human commits to, not at the level work happens to be
  chunked.
- Splitting a subtask into its own PR silently promotes it to a deliverable; if it truly is
  one, make it a TASK on the board first (an artifact-level decision, per [P1](#p1--artifact-grounded-action-evidentiary-primacy)) — don't let
  branch mechanics restructure the plan of record.
- Conversely, a TASK too large to land as one reviewable PR is mis-scoped as a task, not an
  excuse for multi-PR tasks: split the TASK.

## Where these live

| Surface | Role |
|---|---|
| `docs/principles.md` (this file) | Canonical statement + rationale; the upstream reference. |
| `pdlc/templates/CLAUDE.md` — "Rules that always hold" | Operational form planted into every bootstrapped project's always-on grounding. |
| Peer blocks in the planted grounding | The per-system mapping (e.g. Backlog.md dotted-id subtasks ride the parent's PR). |
| Downstream governance artifacts | Domain-specific application, referencing this document (e.g. Coda constitution Principle VIII). |
