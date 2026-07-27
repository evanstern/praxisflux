---
id: TASK-65
title: >-
  gate chassis enforcement contracts: run-gates exit codes, stop-docs root
  matching, gate-runner resolveRoots swallow
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:58'
updated_date: '2026-07-27 03:13'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three enforcement-contract defects in the shared chassis. (1 live) scripts/run-gates.mjs:72-78 — gate functions execute inside names.map(...) at :56, i.e. inside the usage-error try/catch, so any exception thrown WHILE a gate runs exits 2 usage error instead of 1; reproduced with a broken-symlink wiki note (prints usage error: ENOENT..., exit 2). docs/consuming-gates.md:76 pins 0/1/2 as the versioned consumer contract and the same file ships as the @praxisflux/gates bin, so CI consumers branching on exit codes are misdirected. (2) scripts/stop-docs.mjs:32 — (startDir === repo || startDir.startsWith(repo)) is wrong both directions: repo derives from import.meta.url which Node realpaths for ESM entries while startDir is the as-launched CLAUDE_PROJECT_DIR/hook cwd, so any symlinked launch path (incl. macOS /tmp vs /private/tmp) makes startsWith false and the repo own docs-sync Stop gate silently never fires; and without a path-separator boundary a sibling dir like .../praxis-anything satisfies startsWith and can block Stop in an unrelated project whenever praxis docs are stale. (3) lib/gate-runner.mjs:46 — catch { roots = []; } silently swallows a crashing resolveRoots, converting a gate bug into permanent silent non-enforcement, in contrast to :48-49 where a crashing check surfaces as a blocking problem.

Spec: specs/024-gate-exit-contracts
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An exception thrown during gate execution exits 1 (or a distinct documented code), never 2; docs/consuming-gates.md stays accurate; regression test with a throwing gate
- [x] #2 stop-docs root comparison realpaths both sides and requires a path-separator boundary (symlinked launch fires the gate; sibling dirs never match)
- [x] #3 A crashing resolveRoots surfaces as a problem instead of resolving to zero roots
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 024-gate-exit-contracts (hand-authored spec/plan/tasks on branch task-65-gate-exit-contracts) drives. 1. run-gates.mjs: move gate execution out of the usage-error try/catch — a throwing gate exits 1 (documented), never 2; consuming-gates.md stays accurate. 2. stop-docs.mjs: realpath both sides + path-separator boundary. 3. gate-runner.mjs: crashing resolveRoots surfaces as a blocking problem like a crashing check. 4. Regression tests. 5. Versions + wiki re-ground (gate-runner, gates-consumption-surface, test-suite notes). See specs/024-gate-exit-contracts/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane F): tier = default implementer — enforcement-contract fixes bounded by the documented 0/1/2 consumer contract. Checkpoint: if the exit-code contract cannot be kept intact for CI consumers, STOP and surface (outward-facing contract change).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Chassis enforcement contracts fixed (branch task-65-gate-exit-contracts; PR pending merge). (1) scripts/run-gates.mjs: gate execution moved outside the usage try/catch — new exported validateGateNames() is the only exit-2 path; an exception thrown while a gate runs becomes that gate's failure result and exits 1, live-reproduced via a broken-symlink wiki note through the CLI. The 0/1/2 consumer contract survived intact (no new codes; crash reclassified 2 → 1, the documented gate-failed meaning); docs/consuming-gates.md amended minimally. (2) scripts/stop-docs.mjs: new exported underRepo() realpaths both sides and requires a path-separator boundary — symlinked launches (macOS /tmp vs /private/tmp) now fire the repo's docs-sync Stop gate (live-verified; was silent exit 0), and sibling dirs like praxis-anything never match; hook body runAsCli-guarded, behavior through .claude/settings.json unchanged. (3) lib/gate-runner.mjs: a crashing resolveRoots surfaces as a blocking problem in the same shape as a crashing check, never roots=[] silence. Regression tests for all three across run-gates/check-docs/chassis suites. Reconciled with post-58/61/62 main by merge-in (63f01e0): 0.31.0, honest pin classification (7 RE-PIN-ONLY, 4 stamp-verified, test-suite-catalog prose re-verified; superseding pins kept where sources untouched). Gates green at HEAD: node --test 221/221, check-docs, wiki freshness 30/30, bump gate 0.30.0 → 0.31.0.
<!-- SECTION:FINAL_SUMMARY:END -->
