---
id: TASK-64
title: >-
  reorient: run registry keyed to invoking cwd, not the target root — Stop gate
  and finish never see the run
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 01:58'
updated_date: '2026-07-27 02:35'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
(live) scripts/run.mjs:34 sets RUNS = runsDirFor(process.cwd()) at module load while :126 resolves the begin <root> target separately. Reproduced: cd /tmp/a && run.mjs begin /tmp/b writes the manifest under /tmp/a/.handoff/reorient/runs/ and /tmp/b gets no registry — a session working in /tmp/b never resolves the run in reorientGate.resolveRoots (gates/reorient.mjs:133-151), so the may-not-be-left-dangling Stop gate never fires, and finish /tmp/b run from /tmp/b finds nothing. The worktree-first refusal (run.mjs:133-137) likewise inspects the INVOKING checkout, not the target — begin from a worktree targeting the primary checkout is accepted. skills/reorient/SKILL.md:21 states records live at the project root, contradicting the behavior.

Spec: specs/023-reorient-target-root
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Run manifests are written under the resolved target root, regardless of invoking cwd
- [ ] #2 The dangling-run Stop gate fires for a session in the target project
- [ ] #3 finish run from the target resolves the run; worktree-first refusal evaluates the target checkout
- [ ] #4 Cross-directory begin/finish covered by a test
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 023-reorient-target-root (hand-authored spec/plan/tasks on branch task-64-reorient-target-root) drives. 1. run.mjs: resolve the runs dir from the begin/finish TARGET root, not module-load cwd. 2. Worktree-first refusal evaluates the target checkout. 3. Gate resolveRoots then sees runs from a session in the target. 4. Cross-directory begin/finish test. 5. Versions + wiki re-ground (reorient-plugin, reorient-run-ownership notes). See specs/023-reorient-target-root/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane E): tier = default implementer — cwd-vs-target resolution fix with a live repro, isolated to reorient/.
<!-- SECTION:NOTES:END -->
