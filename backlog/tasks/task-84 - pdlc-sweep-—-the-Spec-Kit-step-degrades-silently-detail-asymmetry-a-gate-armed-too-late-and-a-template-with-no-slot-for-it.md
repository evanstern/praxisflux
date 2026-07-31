---
id: TASK-84
title: >-
  pdlc:sweep — the Spec Kit step degrades silently: detail asymmetry, a gate
  armed too late, and a template with no slot for it
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-28 14:59'
updated_date: '2026-07-31 12:46'
labels:
  - debt
dependencies: []
priority: high
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: observed live during a pdlc:sweep of infinitynode.media (12 debt tasks, runbook docs/design/debt-sweep-2026-07-28-runbook.md). The operator explicitly chose, at the sweep's Lane 0 precondition gate, to commit .specify/ and "run the full per-task Spec Kit cycle". Two tasks (TASK-1, TASK-4) nonetheless shipped with a claim-stub spec.md only — no plan.md, no tasks.md, no spec-bridge:link, and both were moved to Done by the backlog CLI directly rather than derived by spec-bridge:sync. Nothing in the sweep detected this, at any point, including its own Output gate.

This is the INVERSE of TASK-79. That task asks the precondition gate to sanction hand-authored specs when .specify/ is absent. Here .specify/ was present, the full cycle was explicitly chosen by the operator, and the loop still degraded — so the two fixes must not collide: TASK-79 widens what is permitted, this narrows what goes unnoticed.

Diagnosis — four upstream causes, in the order they let the failure through:

1. SPECIFICATION-DETAIL ASYMMETRY. pdlc/skills/sweep/SKILL.md:122-142 gives the claim step ~21 lines of mechanical, checkable instruction (exact worktree command, spec-number collision checks, push-race handling, the never-force-push rule). SKILL.md:143-144 gives the entire Spec Kit cycle one sentence. An executing session under load follows the detailed step precisely and reads the one-liner as advisory. In a procedural skill, detail is read as a proxy for obligation.

2. THE ENFORCING GATE IS ARMED TOO LATE. Per the planted CLAUDE.md grounding, spec-bridge's Stop hook blocks a LINKED task's status from exceeding what its spec artifacts prove. But spec-bridge:link is step 4 (SKILL.md:145) — after the spec cycle in step 3. Skipping step 3 therefore also skips step 4, so the gate that exists to catch the omission is never armed. The safety mechanism is disarmed by precisely the mistake it exists to prevent.

3. THE RUNBOOK TEMPLATE HAS NO SLOT FOR PER-TASK ARTIFACTS. templates/runbook.md sections are: Read first / State / Execution lanes / Per-PR gates this project enforces / Concurrency & conflict doctrine / Operator checkpoints / Done means / Execution log. "Per-PR gates" is scoped to PROJECT gates (lint scripts, freshness probes, companion doc amendments). There is no section in which to write "no PR opens for a task until specs/NNN-slug/{spec,plan,tasks}.md exist". What the template does not ask for never reaches the runbook — and the runbook is explicitly the artifact that binds a later session, so the obligation cannot survive a context boundary.

4. THE OUTPUT GATE CANNOT SEE IT. SKILL.md's Output gate requires: every scoped task Done via its own merged PR; project gates green; grounding fresh; no stale worktrees; execution log complete and status flipped. A sweep passes every one of those with zero plan.md or tasks.md anywhere in the repo. The deviation is invisible at the end as well as in flight.

5. OPERATOR DECISIONS RECORDED AS PROSE, NOT AS OBLIGATIONS. The Lane 0 ruling was written into the runbook as narrative ("Operator chose (a)"). No later step reads it back, so a decision that changes the per-task loop had no mechanical consequence.

Host-side contributor, NOT this task's scope: infinitynode.media's .specify/memory/constitution.md was an unfilled template, so speckit-plan had no constitution to check against, which made the plan step read as pure ceremony. Carded in that project separately. It aggravated the failure but none of causes 1-4 depend on it — the same degradation would occur in a host with a ratified constitution.
<!-- SECTION:DESCRIPTION:END -->

Spec: specs/038-speckit-degradation-hardening
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 sweep SKILL.md step 3 states the required artifacts by name (spec.md, plan.md, tasks.md) with the same mechanical specificity the claim step gets, including what to do when the host constitution is absent or unratified
- [ ] #2 spec-bridge:link moves from step 4 into the claim commit in step 2, so the bridge's Stop gate is armed from the branch's first commit rather than after the step it is meant to protect
- [ ] #3 templates/runbook.md gains a 'Per-task artifacts required before PR' section, so the obligation survives into the runbook and therefore across sessions
- [ ] #4 sweep Output gate adds: every scoped task's specs/NNN-*/ contains spec+plan+tasks, or the runbook records an operator-signed escape hatch (reconciled with TASK-79 so the two do not contradict)
- [ ] #5 doctrine sentence: a precondition/Lane-0 decision that changes the per-task loop must be written as a checkable line in the runbook's gate section, not only as prose
- [ ] #6 TASK-79 and this task are cross-referenced and their fixes verified non-contradictory
- [ ] #7 skill version bump + marketplace bump; pdlc-sweep wiki note re-verified; gates green
- [ ] #8 Spec phase: Spec
- [ ] #9 Spec phase: Implement
- [ ] #10 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Doctrine edits per specs/038-speckit-degradation-hardening/plan.md (step 2 claim carries the link; step 3 artifact-named; step 4 link completion; Output gate R4 clause; R5 doctrine line; template per-task-artifacts section)
2. Version bumps: sweep skill 0.13.0, marketplace 0.44.0
3. Wiki: pdlc-sweep NEEDS-REVIEW + summary-style split (body at 7,999/8,000); siblings RE-PIN-ONLY
4. Cross-ref TASK-79 both ways, non-contradiction recorded
5. Gates; PR only with real spec+plan+tasks; merge; spec-bridge:sync
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dispatch record (runbook Lane 1): tier=default implementer, model=claude-opus-5 with operator-ruled fallback claude-opus-4-8 (subscription lacks Opus 5) — Agent param opus resolves to the available Opus; actual model recorded post-dispatch. Doctrine prose, no code; escalation to fable is a checkpoint. Orchestrator: sweep session e38ecfe5.

2026-07-31 (TASK-79 cross-ref): R4 shipped — the sweep Output gate now requires every scoped task's specs/NNN-*/ to contain spec+plan+tasks OR an operator-signed escape line in the runbook naming the task and its stand-in. Verified non-contradictory with TASK-79's planned hand-authored-specs hatch: 79 widens what the precondition gate permits; when exercised, its recorded sanction lands as an instance of R4's escape line (template section 'Per-task artifacts required before PR'), not a competing mechanism — the two compose.
<!-- SECTION:NOTES:END -->
