---
id: TASK-65
title: >-
  gate chassis enforcement contracts: run-gates exit codes, stop-docs root
  matching, gate-runner resolveRoots swallow
status: To Do
assignee: []
created_date: '2026-07-27 01:58'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three enforcement-contract defects in the shared chassis. (1 live) scripts/run-gates.mjs:72-78 — gate functions execute inside names.map(...) at :56, i.e. inside the usage-error try/catch, so any exception thrown WHILE a gate runs exits 2 usage error instead of 1; reproduced with a broken-symlink wiki note (prints usage error: ENOENT..., exit 2). docs/consuming-gates.md:76 pins 0/1/2 as the versioned consumer contract and the same file ships as the @praxisflux/gates bin, so CI consumers branching on exit codes are misdirected. (2) scripts/stop-docs.mjs:32 — (startDir === repo || startDir.startsWith(repo)) is wrong both directions: repo derives from import.meta.url which Node realpaths for ESM entries while startDir is the as-launched CLAUDE_PROJECT_DIR/hook cwd, so any symlinked launch path (incl. macOS /tmp vs /private/tmp) makes startsWith false and the repo own docs-sync Stop gate silently never fires; and without a path-separator boundary a sibling dir like .../praxis-anything satisfies startsWith and can block Stop in an unrelated project whenever praxis docs are stale. (3) lib/gate-runner.mjs:46 — catch { roots = []; } silently swallows a crashing resolveRoots, converting a gate bug into permanent silent non-enforcement, in contrast to :48-49 where a crashing check surfaces as a blocking problem.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An exception thrown during gate execution exits 1 (or a distinct documented code), never 2; docs/consuming-gates.md stays accurate; regression test with a throwing gate
- [ ] #2 stop-docs root comparison realpaths both sides and requires a path-separator boundary (symlinked launch fires the gate; sibling dirs never match)
- [ ] #3 A crashing resolveRoots surfaces as a problem instead of resolving to zero roots
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.
<!-- SECTION:NOTES:END -->
