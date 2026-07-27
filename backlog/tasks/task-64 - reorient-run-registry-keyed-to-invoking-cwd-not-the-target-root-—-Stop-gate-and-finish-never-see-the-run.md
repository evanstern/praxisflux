---
id: TASK-64
title: >-
  reorient: run registry keyed to invoking cwd, not the target root — Stop gate
  and finish never see the run
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:58'
updated_date: '2026-07-27 03:30'
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
- [x] #1 Run manifests are written under the resolved target root, regardless of invoking cwd
- [x] #2 The dangling-run Stop gate fires for a session in the target project
- [x] #3 finish run from the target resolves the run; worktree-first refusal evaluates the target checkout
- [x] #4 Cross-directory begin/finish covered by a test
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
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

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reorient registry re-keyed to the target root (branch task-64-reorient-target-root; PR pending merge). reorient/scripts/run.mjs no longer captures runsDirFor(process.cwd()) at module load: begin resolves the registry from the resolved target root, and finish/abandon/takeover/list resolve via a registryFor(key) helper; REORIENT_HOME semantics unchanged; list gained an optional [root]. gates/reorient.mjs resolveRoots scopes runs to run.root (target) with run.cwd kept as legacy fallback + provenance — the dangling-run Stop gate now fires for sessions working in the target. The worktree-first refusal inspects the TARGET's checkout shape (worktree→primary refused without the recorded --shared-checkout override; primary→worktree accepted). SKILL.md's records-live-at-the-project-root claim is now true (v0.5.0). Cross-directory tests: begin-from-elsewhere lands under the target, gate blocks in-target, finish resolves by root key and bare id, refusal keyed both directions; original live repro re-run green against the fix. Documented consequence (deliberate): owner heartbeat/Stop-nag flow only while the owner works in the target. Reconciled with post-58/61/62/65/59 main by merge-in (86f675a): 0.33.0, honest pin classification (7 computed, 5 reviewed incl. a real gate-runner-diff review for reorient-run-ownership). Gates green at HEAD: node --test 230/230, check-docs, wiki freshness, bump gate 0.32.0 → 0.33.0. Flagged for operator (not carded): test-suite-catalog.md omits test/reorient.test.mjs from its sources (pre-existing).
<!-- SECTION:FINAL_SUMMARY:END -->
