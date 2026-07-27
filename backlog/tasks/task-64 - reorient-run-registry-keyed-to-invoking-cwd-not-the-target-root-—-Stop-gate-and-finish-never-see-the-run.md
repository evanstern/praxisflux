---
id: TASK-64
title: >-
  reorient: run registry keyed to invoking cwd, not the target root — Stop gate
  and finish never see the run
status: To Do
assignee: []
created_date: '2026-07-27 01:58'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
(live) scripts/run.mjs:34 sets RUNS = runsDirFor(process.cwd()) at module load while :126 resolves the begin <root> target separately. Reproduced: cd /tmp/a && run.mjs begin /tmp/b writes the manifest under /tmp/a/.handoff/reorient/runs/ and /tmp/b gets no registry — a session working in /tmp/b never resolves the run in reorientGate.resolveRoots (gates/reorient.mjs:133-151), so the may-not-be-left-dangling Stop gate never fires, and finish /tmp/b run from /tmp/b finds nothing. The worktree-first refusal (run.mjs:133-137) likewise inspects the INVOKING checkout, not the target — begin from a worktree targeting the primary checkout is accepted. skills/reorient/SKILL.md:21 states records live at the project root, contradicting the behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Run manifests are written under the resolved target root, regardless of invoking cwd
- [ ] #2 The dangling-run Stop gate fires for a session in the target project
- [ ] #3 finish run from the target resolves the run; worktree-first refusal evaluates the target checkout
- [ ] #4 Cross-directory begin/finish covered by a test
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.
<!-- SECTION:NOTES:END -->
