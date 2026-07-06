---
id: TASK-1.2
title: Extract the shared Node chassis into lib/
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 17:06'
updated_date: '2026-07-06 18:29'
labels:
  - chassis
dependencies:
  - TASK-1.1
parent_task_id: TASK-1
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the zero-dependency Node modules both plugins need: project-root (findRootUpwards + detectProjectKind), gate-runner (Stop-hook harness: read stdin, honor stop_hook_active, additive gate dispatch, exit 0/2), markdown (parseFrontmatter, stripCode, extractWikilinks, resolveLinks), selfcontained (HTML verifier), lifecycle (status-cannot-exceed-proven-artifacts engine), installer (dotfile-safe copy, fresh vs update/migrate mode, ensures .gitignore has .handoff/), dates, template.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 each module is zero-dep and independently usable
- [x] #2 lifecycle engine expresses 'status cannot exceed proven artifacts' generically
- [x] #3 installer supports fresh-install AND idempotent update/migrate, dotfile-safe, and appends .handoff/ to .gitignore
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Write 8 zero-dep Node ESM modules under lib/: (1) project-root.mjs — findRootUpwards, findRootsDownwards, hasChild; (2) markdown.mjs — parseFrontmatter, stripCode, extractWikilinks, linkTarget, resolveLinks; (3) dates.mjs — today, bumpUpdated; (4) template.mjs — render {{VARS}}; (5) selfcontained.mjs — HTML verifier (ports verify_artifact.py: fail on external loads + missing title; warn on no theme / no data table); (6) lifecycle.mjs — createLifecycle/computeArtifacts (generalize progress.mjs's status-cannot-exceed-proven-artifacts); (7) installer.mjs — copyDir (dotfile-safe cpSync), ensureGitignore('.handoff/'), verifyPresent, fresh-vs-update; (8) gate-runner.mjs — Stop-hook harness (read stdin, honor stop_hook_active, resolve roots per gate, run additively, exit 0/2). Add lib/smoke.test.mjs (node:test) exercising each module; run it; commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Wrote 8 zero-dep ESM modules in lib/: project-root, markdown, dates, template, selfcontained, lifecycle, installer, gate-runner. Ported research's Python gate logic (verify_artifact -> selfcontained.checkHtml; verify_branch/analysis parsing -> markdown) and generalized educate's progress.mjs into lifecycle.createLifecycle. Fixed a real bug found by tests: lifecycle now reports each missing required artifact once (was double-counting artifacts required by multiple states). test/chassis.test.mjs (node:test) exercises every module: 8 tests pass (node --test).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shared chassis extracted into lib/ as 8 zero-dep Node modules with a passing node:test smoke suite. project-root (walk up / find nested down), markdown (frontmatter/code-strip/wikilinks), dates, template, selfcontained (CSP verifier), lifecycle (status<=proven-artifacts engine), installer (dotfile-safe copy + idempotent .gitignore/.handoff + fresh/update mode), gate-runner (Stop-hook harness w/ loop guard + additive dispatch). This is the foundation the ports (1.3/1.4) build on.
<!-- SECTION:FINAL_SUMMARY:END -->
