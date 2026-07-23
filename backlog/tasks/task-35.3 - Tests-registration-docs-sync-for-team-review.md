---
id: TASK-35.3
title: Tests + registration + docs sync for team-review
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-23 05:16'
updated_date: '2026-07-23 16:31'
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
- [ ] #1 All listed test cases green under node --test; pre-commit and CI pass
- [ ] #2 Registration, README row, version bumps, wiki freshness all green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. test/team-review.test.mjs under TEAM_REVIEW_HOME fixtures: checkReview (all sections present passes; each missing section named; citation resolution incl. repeated-basename tolerance; report-inside-target rejection; untouched vs mutated git snapshot), run lifecycle via the CLI (begin/finish/abandon; distinct ids on same-second collision), stop-hook evaluate paths through lib/gate-runner evaluate (block in scope with guidance, stop_hook_active allow, no-op when no runs / done runs / out-of-scope cwd).
2. Registry drift test: run-gates GATES vs action.yml — already shipped in test/run-gates.test.mjs ('GATES registry and action.yml agree on the gate names'); verify it satisfies the review's ask rather than duplicating it.
3. Version bump per docs/releasing.md: minor (new plugin) -> sync-version 0.9.0; skill already v1.0.0; registration + README row landed in 35.2.
4. Wiki: add docs/wiki/team-review-plugin.md (new subsystem) + INDEX line + links; wiki-update pass for notes staled by the 35.2 commit (marketplace.json is a build-and-release source); freshness gate green.
5. Full suite + pre-commit green.
<!-- SECTION:PLAN:END -->
