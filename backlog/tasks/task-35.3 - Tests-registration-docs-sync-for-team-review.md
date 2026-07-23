---
id: TASK-35.3
title: Tests + registration + docs sync for team-review
status: Done
assignee:
  - '@claude'
created_date: '2026-07-23 05:16'
updated_date: '2026-07-23 16:38'
labels: []
dependencies: []
parent_task_id: TASK-35
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
node --test coverage: checkReview (sections present/missing, citation resolution incl. repeated-basename tolerance, report-inside-target rejection, untouched vs mutated snapshot), run lifecycle (begin/finish/abandon, same-second id collision), stop-hook evaluate paths. Plus the review's registry drift test: run-gates.mjs GATES keys appear in action.yml's documented list. Then: marketplace.json entry (via the now-generative gen-marketplace), README table row, marketplace version bump + skill v1.0.0 per docs/releasing.md, wiki-update pass for touched grounding docs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All listed test cases green under node --test; pre-commit and CI pass
- [x] #2 Registration, README row, version bumps, wiki freshness all green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. test/team-review.test.mjs under TEAM_REVIEW_HOME fixtures: checkReview (all sections present passes; each missing section named; citation resolution incl. repeated-basename tolerance; report-inside-target rejection; untouched vs mutated git snapshot), run lifecycle via the CLI (begin/finish/abandon; distinct ids on same-second collision), stop-hook evaluate paths through lib/gate-runner evaluate (block in scope with guidance, stop_hook_active allow, no-op when no runs / done runs / out-of-scope cwd).
2. Registry drift test: run-gates GATES vs action.yml — already shipped in test/run-gates.test.mjs ('GATES registry and action.yml agree on the gate names'); verify it satisfies the review's ask rather than duplicating it.
3. Version bump per docs/releasing.md: minor (new plugin) -> sync-version 0.9.0; skill already v1.0.0; registration + README row landed in 35.2.
4. Wiki: add docs/wiki/team-review-plugin.md (new subsystem) + INDEX line + links; wiki-update pass for notes staled by the 35.2 commit (marketplace.json is a build-and-release source); freshness gate green.
5. Full suite + pre-commit green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
test/team-review.test.mjs (11 tests): checkReview sections/citations (incl. repeated-basename tolerance and unresolving-count message), report-inside-target rejection, mutated-vs-restored snapshot; run lifecycle begin/finish(blocked-then-pass)/abandon + same-second collision via a pre-created record with retry across second boundaries; stop-hook paths through gate-runner evaluate (block+guidance, stop_hook_active, out-of-scope, finished-run no-op); runsDirFor walk-up + TEAM_REVIEW_HOME override. Strengthened the run-gates/action.yml drift test to parse action.yml's documented gate list instead of asserting a hardcoded copy. Gotcha worth keeping: tests that drive evaluate() must delete CLAUDE_PROJECT_DIR (the session sets it and it outranks input.cwd) and realpath mkdtemp dirs (macOS /var symlink vs the CLI's resolved cwd). Suite now 138 pass; pre-commit ran green on all three commits. Versions synced 0.8.0 -> 0.9.0 (minor: new plugin); skill at 1.0.0. Wiki: new team-review-plugin note; overview/build-and-release/test-suite/skill-patterns reviewed+updated; post-bump stamp-only re-pins executed from the plan; freshness 24/24 fresh. Bump gate vs main: ok. Full build packages team-review with lib dereferenced.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Test coverage, registration, and docs sync for team-review: node --test covers checkReview, the run lifecycle CLI, and the Stop-hook evaluate paths (test/team-review.test.mjs); the run-gates GATES/action.yml registry drift test now reads action.yml's real documented list. Marketplace entry rode the generative gen-marketplace (35.2); README row + install line present; versions bumped 0.8.0 -> 0.9.0 with skill v1.0.0 per docs/releasing.md; wiki gained a team-review-plugin note and all touched grounding notes were re-verified and re-pinned — freshness gate 24/24, check-docs green, suite 138 pass, bump gate vs main ok.
<!-- SECTION:FINAL_SUMMARY:END -->
