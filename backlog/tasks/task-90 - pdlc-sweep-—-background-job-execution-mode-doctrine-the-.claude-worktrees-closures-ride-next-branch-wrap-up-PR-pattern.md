---
id: TASK-90
title: >-
  pdlc:sweep — background-job execution mode: doctrine the .claude/worktrees +
  closures-ride-next-branch + wrap-up-PR pattern
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-31 15:22'
updated_date: '2026-07-31 17:48'
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
- [x] #1 sweep SKILL.md names the background-job/no-main-push execution mode (or records the sanctioned-deviation rule) covering worktree location, closure-rides-next-branch, wrap-up PR
- [x] #2 step 2/9/10 wording acknowledges the mode instead of contradicting it
- [x] #3 TASK-85 cross-referenced; wording reconciled, not implemented
- [x] #4 skill version bump + marketplace bump; pdlc-sweep note re-verified; gates green
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier default-implementer, pinned claude-opus-4-8 via .claude/agents/opus-implementer.md agent definition. Justification: doctrine prose naming an execution mode this very sweep runs under; no code. Grouping call: single dispatch covers Implement+Prove (TASK-84 precedent).

2026-07-31: cross-ref TASK-85 — its future two-track landing rule (board commits direct to main; deliverables by PR) is reconciled inside this task's background-job mode section (board track degrades to rides-next-branch / wrap-up PR in that mode). 85 not implemented here; a matching note was appended to TASK-85.

2026-07-31 (Implement+Prove, opus-implementer): R1-R4 landed on task-90-sweep-background-job-mode. SKILL.md 0.14.0->0.15.0 gains a Background-job / no-main-push execution mode subsection (trigger + 3 substitutes + 2026-07-30/31 runbook provenance + TASK-85 two-track reconcile sentence); steps 2/9/10 point at it. Marketplace lockstep 0.47.0->0.48.0 (sync-version.mjs). pdlc-sweep.md amended (one-line mode mention, NEEDS-REVIEW) + re-pinned; pdlc-sweep-history.md RE-PIN reviewed (no amend, budget full); 11 lockstep notes RE-PIN-ONLY to the bump commit. Gates green: node --test 252/0, check-docs, freshness. TASK-85 cross-ref notes on both cards; 85 NOT implemented.
<!-- SECTION:NOTES:END -->
