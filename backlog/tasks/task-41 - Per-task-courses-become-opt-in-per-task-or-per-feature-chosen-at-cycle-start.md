---
id: TASK-41
title: 'Per-task courses become opt-in: per-task or per-feature, chosen at cycle start'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-23 17:26'
updated_date: '2026-07-26 14:13'
labels: []
dependencies: []
references:
  - >-
    backlog/docs/reviews/doc-1 -
    Team-review-2026-07-23-—-praxisflux-vs-its-own-tenets.md
priority: medium
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Owner decision (2026-07-23, team-review follow-up): weaken the per-task course mandate to entirely opt-in. Offer 'per task' or 'per feature' as the granularity options — either as a standing project choice or enforced as an opt-in prompt at each cycle start (the task decides which spelling and records it). Review context: courses are the methodology's heaviest ceremony (2.2MB generated HTML, ~10 of 66 Done tasks compliant, docs/task-courses.md overclaims 'every completed task', and every historical course fails its gate on the next chrome bump). The rewrite must also state the freshness stance for opt-in courses (pin like the wiki, or snapshot-exempt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/task-courses.md rewritten: courses are opt-in, the every-task mandate language is gone, and per-task vs per-feature granularity options are documented
- [ ] #2 The opt-in mechanism is decided and recorded (standing project choice vs cycle-start prompt), including where the choice lives as an artifact
- [ ] #3 The existing course gap (10 of 66 Done tasks) is reconciled with the new policy so no doc claims more than the artifacts prove
- [ ] #4 A freshness stance for opt-in courses is stated (pinned like the wiki, or explicitly snapshot-exempt per task-courses.md option 2)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 006-courses-opt-in (hand-authored)
2. spec-bridge:link
3. Dispatch: rewrite docs/task-courses.md to opt-in (standing per-project choice: per-task | per-feature | none, recorded in project grounding), fix the 'every completed task' overclaim, state freshness stance for opt-in courses; update repo CLAUDE.md mandate line; record praxisflux's own standing choice
4. Gates; course for THIS task (mandate in force until merge); PR; serial merge
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 1 (docs/design/board-clearing-runbook.md). Tier: default implementer (ratified-decision docs rewrite). Operator decision at sign-off: standing per-project choice, no per-cycle prompt.
<!-- SECTION:NOTES:END -->
