---
id: TASK-47
title: 'pdlc:sweep — bake claim-before-work doctrine into the runbook template'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-25 22:19'
updated_date: '2026-07-25 22:27'
labels: []
dependencies: []
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Companion to promptworld TASK-139 / specs/065-claim-before-work — operator-agreed AC #1. The pdlc sweep runbook template (pdlc/skills/sweep/templates/runbook.md) must instruct executing sessions to claim board card + spec number BEFORE any authoring/code (first commit claims it, push immediately, never force-push), and treat a rejected push as signal that the race was lost — fetch, re-check board/specs/, stop the lane and surface to operator if truly contended. Replace the weak existing bullet ('Spec-number collisions: check origin/main:specs/ before claiming an NNN.') in the '## Concurrency & conflict doctrine' section with a compact claim-before-work block, keeping the other existing bullets (hotspots, rebase-never-merge-commit, smaller-PR-merges-first, verify-merged-before-delete). Also name the mechanical checks where a host project ships merge-drift gates (claim --dir, worktree --spec/--task).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 runbook.md 'Concurrency & conflict doctrine' section replaces the spec-number-collision bullet with a claim-before-work block covering: first-commit claims (board card -> In Progress AND spec dir stub), push immediately, never force-push a claim
- [x] #2 block states rejected push == lost the race: fetch + re-read board/specs before assuming; stop lane and surface to operator if task/number now held by someone else; unrelated rejection with task+number still free -> rebase and re-push
- [x] #3 block states task branches push on first commit (git push -u origin <branch>) for auditability
- [x] #4 block names the mechanical merge-drift-gate checks (claim --dir NNN-slug; worktree --spec NNN --task TASK-n) for host projects that ship them
- [x] #5 other existing bullets in the section (hotspots, rebase-never-merge-commit, smaller-PR-merges-first, verify-merged-before-delete) preserved
- [x] #6 sweep skill version bumped in SKILL.md frontmatter and marketplace version bumped via scripts/sync-version.mjs, per docs/releasing.md
- [x] #7 docs/courses/TASK-47/ built and passes the course gate
- [x] #8 docs/wiki freshness gate green (re-pin pdlc-plugin.md note if it fails on this diff)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Edit pdlc/skills/sweep/templates/runbook.md Concurrency & conflict doctrine section: replace spec-number-collision bullet with claim-before-work block (claim=first commit -> board In Progress + spec dir stub, push immediately, never force-push; rejected push = lost race -> fetch/re-check/stop-and-surface vs rebase-and-repush; task branches push -u on first commit; name claim --dir / worktree --spec --task mechanical checks). Keep other bullets.
2. Bump pdlc/skills/sweep/SKILL.md version (0.2.0 -> 0.3.0, minor: doctrine change users will notice in generated runbooks) and marketplace version via node scripts/sync-version.mjs 0.13.0.
3. Run scripts/check-version-bump.mjs and scripts/check-docs.mjs; run grounding-wiki:wiki-update only if freshness gate fails on this diff (pdlc-plugin.md note lists sweep as source).
4. Build docs/courses/TASK-47/ per docs/task-courses.md, pass course gate.
5. Commit in slices, push branch, open PR, attempt merge --merge.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Runbook template's Concurrency & conflict doctrine section: replaced the spec-number-collision bullet with a claim-before-work block (claim on first commit; rejected push = lost race; task branches push -u on first commit; names claim --dir / worktree --spec --task mechanics for merge-drift-gate hosts). Kept the other 4 existing bullets. Bumped sweep skill 0.2.0 -> 0.3.0 (SKILL.md frontmatter) and marketplace 0.12.1 -> 0.13.0 via scripts/sync-version.mjs. check-version-bump.mjs and check-docs.mjs pass. Wiki freshness gate failed on the lockstep bump (10 notes staled, same pattern as TASK-46's precedent) -- ran grounding-wiki:wiki-update: 9 stamp-only re-pins, pdlc-plugin.md content-reviewed and updated to describe the new doctrine. Freshness gate now green (25/25 fresh). Branch task-47-claim-before-work-doctrine pushed to origin. Course (AC #7) still pending.

Course built: docs/courses/TASK-47/ (3 modules — The Race Nobody Wins, First Commit Wins, When the Push Bounces), chrome copied verbatim from codebase-to-course canonical references/, build.sh translation-block validation passes, course gate passes (both the plugin cache gate and the repo's own codebase-to-course/gates/cli.mjs). All 8 ACs now met.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the sweep runbook template's weak spec-number-collision line with a full claim-before-work doctrine block in pdlc/skills/sweep/templates/runbook.md's Concurrency & conflict doctrine section: first-commit claims (board -> In Progress + spec dir stub), push immediately with git push -u, never force-push, rejected-push-means-lost-race (fetch/re-check -> stop-and-surface vs rebase-and-repush), and the merge-drift-gate mechanical checks (claim --dir, worktree --spec --task) for hosts that ship them. Bumped sweep skill 0.2.0 -> 0.3.0 and marketplace 0.12.1 -> 0.13.0 (minor, via scripts/sync-version.mjs) -- both check-version-bump.mjs and check-docs.mjs pass. The lockstep version bump staled 10 wiki notes; ran grounding-wiki:wiki-update (9 stamp-only re-pins, pdlc-plugin.md content-reviewed against the actual diff and its Execute/mechanics paragraphs updated) -- freshness gate now green (25/25). Built docs/courses/TASK-47/, 3 modules, course gate passes. Branch task-47-claim-before-work-doctrine pushed; opening PR next.
<!-- SECTION:FINAL_SUMMARY:END -->
