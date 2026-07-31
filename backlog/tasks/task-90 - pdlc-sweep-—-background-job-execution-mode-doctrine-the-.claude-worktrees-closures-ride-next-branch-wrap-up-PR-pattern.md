---
id: TASK-90
title: >-
  pdlc:sweep — background-job execution mode: doctrine the .claude/worktrees +
  closures-ride-next-branch + wrap-up-PR pattern
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-31 15:22'
updated_date: '2026-07-31 17:36'
labels:
  - pdlc-sweep
dependencies:
  - TASK-89
priority: medium
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-11-12-22 over 9d5b81d..f3abebe (lead intent-drift pass). Evaluation report: docs/reviews/team-review-sweep-close-84-2026-07-31-15-12-53.md (finding 5); triage record: docs/reviews/refactor-triage-praxis-2026-07-31-11-12-22.md. Accepted by operator 2026-07-31 (card now — two occurrences suffice; same 'precedent pretending to be exception' shape as TASK-79).

Both 2026-07-30/31 sweeps ran as Claude Code background jobs and systematically deviated from doctrine that assumes an interactive session with main-push rights: task worktrees at .claude/worktrees/task-N under harness isolation instead of .worktrees/task-N (SKILL.md:138); post-merge tasks.md ticks + spec-bridge:sync riding the NEXT task's branch instead of committed at root (SKILL.md:232-236); board/spec commands run inside the task worktree, not root (SKILL.md:243-244); sweep-close (final closure + runbook status flip) landing via a small wrap-up PR because background jobs never push main. The pattern is recorded only in docs/design/sweep-cost-levers-runbook.md and docs/design/speckit-degradation-runbook.md (execution-log notes + concurrency doctrine section). Decide: doctrine it as a named execution mode in sweep SKILL.md (background-job/no-main-push hosts follow the substitute steps), or explicitly sanction runbook-recorded deviation as the mechanism. Adjacent: TASK-85 (bootstrap plants the two-track landing rule) — reconcile wording, do not implement 85 here. Dependency on TASK-89: same two files; serial merge order, 89 first.

Spec: specs/043-sweep-background-job-mode
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 sweep SKILL.md names the background-job/no-main-push execution mode (or records the sanctioned-deviation rule) covering worktree location, closure-rides-next-branch, wrap-up PR
- [ ] #2 step 2/9/10 wording acknowledges the mode instead of contradicting it
- [ ] #3 TASK-85 cross-referenced; wording reconciled, not implemented
- [ ] #4 skill version bump + marketplace bump; pdlc-sweep note re-verified; gates green
<!-- AC:END -->
