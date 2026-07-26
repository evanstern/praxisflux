# 006-courses-opt-in — per-task courses become a standing project choice

Board: TASK-41 · Sweep: `docs/design/board-clearing-runbook.md` (Lane 1) ·
Direction: owner decision 2026-07-23 (team-review follow-up, in the task description);
operator decision at sweep sign-off 2026-07-26: **standing per-project choice**, no
per-cycle prompt.

## Problem

Courses are the methodology's heaviest ceremony (2.2MB generated HTML per course), only
~10 of 66 Done tasks comply, `docs/task-courses.md` overclaims "every completed task",
and historical courses fail their gate on the next chrome bump. The mandate is being
weakened to opt-in; the docs must tell the truth and record the mechanism.

## Requirements

### R1 — docs/task-courses.md rewritten to opt-in (AC #1, #2)

- The every-task mandate language is gone. Courses are **opt-in via a standing project
  choice**: each project records once whether it wants courses `per-task`,
  `per-feature`, or `none`.
- **Where the choice lives (the artifact):** a `courses:` line in the project's PDLC
  grounding — for praxisflux itself, a short "Course policy" stanza in this doc plus a
  matching line in the repo `CLAUDE.md` workflow section (step 4). State that
  pdlc-bootstrapped projects record it in their planted grounding block (the template
  change itself is TASK-43/DOWNSTREAM scope — here we only document the convention; do
  NOT edit pdlc/templates).
- Document both granularities: per-task (course per TASK) and per-feature (one course
  per shipped feature/epic, named for the feature).

### R2 — reconcile the existing gap honestly (AC #3)

- The doc must state the historical reality: courses exist for a subset of Done tasks
  (built under the old mandate); the new policy does not retroactively require or
  delete them. No praxisflux doc may claim more coverage than the artifacts prove —
  fix the repo `CLAUDE.md` step-4 mandate line to the new policy in the same PR.

### R3 — freshness stance (AC #4)

- State it explicitly: opt-in courses are **snapshot-exempt** — a course documents the
  task's work at merge time and is never re-pinned; the course gate applies at build
  time only (this matches observed reality: chrome bumps invalidate old courses, and
  re-verification would be ceremony without a consumer).

### R4 — praxisflux's own standing choice

- Record praxisflux's choice: **per-feature** (a course per shipped feature/sweep-scale
  deliverable, on request), not per-task. This PR is the policy change itself.

### R5 — proof

- This task merges under the OLD mandate, so `docs/courses/TASK-41/` is still built,
  gate-green, in this PR (the last mandatory course).
- Gates: node --test, check-docs (README/CLAUDE sync — CLAUDE.md changes here!),
  wiki-freshness (v2 hard: re-pin any note sourcing docs/task-courses.md or CLAUDE.md;
  regenerate CAPSULES.md if any description changes).
- Docs-only diff (docs/, CLAUDE.md, backlog, specs): no version bumps.

## Non-goals

- No pdlc template edits (TASK-43's bootstrap run + downstream tasks own the planted
  block); no deletion of historical courses; no course-gate changes.

## Acceptance

Board ACs #1–#4 map to R1–R3; R4/R5 are the repo's own application + proof.
