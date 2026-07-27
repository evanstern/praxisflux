---
id: TASK-68
title: >-
  grounding-wiki repin.mjs: validate that the target commit exists, not just
  hash format
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 04:33'
updated_date: '2026-07-27 13:48'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
During the TASK-59 reconcile, a wrongly-typed but format-valid 40-char hash was passed to grounding-wiki/scripts/repin.mjs and written verbatim into a note's verified_against — the freshness gate caught it downstream, but the repin tool itself accepted a commit that does not exist. repin.mjs already refuses short hashes, missing notes, and pinless files; add existence validation (e.g. git cat-file -e <hash>^{commit} in the corpus repo) so a nonexistent commit is refused at write time with a named error. Origin: incident reported by TASK-59's implementer during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.

Spec: specs/029-repin-commit-existence
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 repin.mjs refuses a well-formed hash that names no commit in the repo, with an error naming the hash
- [ ] #2 Existing refusals (short hash, missing note, pinless file) unchanged
- [ ] #3 Regression test covers the nonexistent-commit case
- [ ] #4 Spec phase: Spec
- [ ] #5 Spec phase: Implement
- [ ] #6 Spec phase: Prove
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author spec 029-repin-commit-existence (spec/plan/tasks). 2. Add commit-existence validation to grounding-wiki/scripts/repin.mjs (git cat-file -e <hash>^{commit} in the corpus repo) refusing a well-formed hash that names no commit, error naming the hash. 3. Regression test in test/grounding-wiki.freshness.test.mjs; existing refusals unchanged. 4. node --test, check-docs, freshness, version bump + same-PR wiki re-pins (grounding-wiki-plugin, test-suite-catalog).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch (runbook docs/design/sweep-followups-runbook.md): model tier = default implementer — bounded validation fix with three crisp ACs; no escalation trigger.
<!-- SECTION:NOTES:END -->
