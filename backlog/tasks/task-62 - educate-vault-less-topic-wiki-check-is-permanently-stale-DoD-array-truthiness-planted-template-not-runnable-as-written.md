---
id: TASK-62
title: >-
  educate: vault-less topic wiki --check is permanently stale; DoD array
  truthiness; planted template not runnable as written
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:57'
updated_date: '2026-07-27 03:04'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
(live) scripts/wiki.mjs:96 — the named-topic --check branch calls isStale with no vault-count guard, so a topic with no research vaults has no WIKI.md and reports stale (run --sync), exit 1; wiki.mjs:56 syncTopicWiki returns skipped for vault-less topics and never writes the file. Reproduced loop: check exit 1 -> sync skipped exit 0 -> check exit 1, forever; the tool remedy message is a no-op. (--all --check masks it by pre-filtering to vaulted topics; only the single-topic form is broken.) Also: gates/dod.mjs:28 tests bare truthiness on decksStandardForEveryLesson, so an empty array [] (truthy) still requires deck+guide — inconsistent with the array-tolerant isDelegated at :36-38. Template issues: templates/CLAUDE.md:52-53,74-75 ship literal ${CLAUDE_PLUGIN_ROOT} commands that are undefined in a user-project Bash environment, and skills/start/SKILL.md:34 says copy the template with no instruction to substitute the {{PROJECT_NAME}} placeholder.

Spec: specs/022-educate-check-convergence
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Single-topic --check on a vault-less topic converges with --sync (distinct no-vaults verdict or exit 0), and the check/sync exit-code contract is consistent
- [x] #2 Empty-array decksStandardForEveryLesson is handled consistently with isDelegated
- [x] #3 Planted CLAUDE.md gate/sync commands are runnable as written in a user project
- [x] #4 start skill instructs placeholder substitution when planting the template
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 022-educate-check-convergence (hand-authored spec/plan/tasks on branch task-62-educate-check-convergence) drives. 1. wiki.mjs: single-topic --check gains the vault-count guard — vault-less topic gets a distinct no-vaults verdict consistent with --sync's skipped (converging exit codes). 2. dod.mjs: empty-array decksStandardForEveryLesson handled like isDelegated. 3. templates/CLAUDE.md: commands runnable as written in a user project (no unresolved ${CLAUDE_PLUGIN_ROOT}). 4. start SKILL.md: instruct {{PROJECT_NAME}} substitution. 5. Tests + versions + wiki re-ground (educate-plugin note). See specs/022-educate-check-convergence/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane D first; TASK-63 waits on this merge — shared educate/gates/dod.mjs + templates/CLAUDE.md): tier = default implementer — three bounded fixes with live repros.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Educate convergence + template fixes shipped (branch task-62-educate-check-convergence; PR pending merge). (1) Single-topic wiki --check now carries syncTopicWiki's vault-count guard: a vault-less topic prints a distinct no-vaults verdict at exit 0 — the live check→sync→check infinite loop is gone; --all unchanged. (2) New exported decksRequired() in educate/gates/dod.mjs gives decksStandardForEveryLesson the same array tolerance as isDelegated (empty array no longer demands deck+guide). (3) Planted CLAUDE.md commands are runnable as written: ${CLAUDE_PLUGIN_ROOT} replaced by an {{EDUCATE_PLUGIN_ROOT}} placeholder resolved at plant time; --root dropped in favor of cwd walk-up. (4) start skill (0.2.0) plants by rendering per lib/template.mjs and verifies no token survives; update-mode reconcile diffs against the rendered template. Tests: vault-less convergence via spawned CLI, decksRequired truths, install-path plant simulation running every planted command as written. Wiki: educate-plugin re-grounded; test-suite split summary-style (test-suite + new test-suite-catalog) to stay under the 8k body budget. Reconciled with post-58/61 main by merge-in (5aa19b1): 0.30.0, honest pin classification (10 stamp-only; team-review-plugin took main's prose wholesale; TASK-61's test coverage folded into the catalog note). Gates green at HEAD: node --test 217/217, check-docs, wiki freshness 30/30, bump gate 0.29.0 → 0.30.0.
<!-- SECTION:FINAL_SUMMARY:END -->
