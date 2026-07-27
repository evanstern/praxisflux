---
id: TASK-68
title: >-
  grounding-wiki repin.mjs: validate that the target commit exists, not just
  hash format
status: To Do
assignee: []
created_date: '2026-07-27 04:33'
labels:
  - sweep-followup
dependencies: []
priority: low
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
During the TASK-59 reconcile, a wrongly-typed but format-valid 40-char hash was passed to grounding-wiki/scripts/repin.mjs and written verbatim into a note's verified_against — the freshness gate caught it downstream, but the repin tool itself accepted a commit that does not exist. repin.mjs already refuses short hashes, missing notes, and pinless files; add existence validation (e.g. git cat-file -e <hash>^{commit} in the corpus repo) so a nonexistent commit is refused at write time with a named error. Origin: incident reported by TASK-59's implementer during the downstream-bugfix sweep (runbook docs/design/downstream-bugfix-runbook.md); carding approved by operator 2026-07-27.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 repin.mjs refuses a well-formed hash that names no commit in the repo, with an error naming the hash
- [ ] #2 Existing refusals (short hash, missing note, pinless file) unchanged
- [ ] #3 Regression test covers the nonexistent-commit case
<!-- AC:END -->
