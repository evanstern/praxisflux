---
id: TASK-68
title: >-
  grounding-wiki repin.mjs: validate that the target commit exists, not just
  hash format
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 04:33'
updated_date: '2026-07-27 13:57'
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
- [x] #1 repin.mjs refuses a well-formed hash that names no commit in the repo, with an error naming the hash
- [x] #2 Existing refusals (short hash, missing note, pinless file) unchanged
- [x] #3 Regression test covers the nonexistent-commit case
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

Implemented (abadcf4): repin() probes commit existence with git -C <dirname(note)> cat-file -e <hash>^{commit} after format/note/pin-line checks, before any write. Ghost hash -> named error carrying the hash, note byte-identical; note outside a git repo -> its own named error. Existing refusals + CLI contract unchanged (exit 2 usage / exit 1 refusal / old -> new success, verified manually). Regression tests added in test/grounding-wiki.freshness.test.mjs: 'repin: refuses a well-formed hash naming no commit; note left byte-identical' and 'repin: refuses a note that sits outside any git repo'. Full suite 244 pass.

Wiki re-pinned in-branch (7fb7a48): test-suite-catalog re-verified vs the diff (entry now names the commit-existence refusals) and grounding-wiki-plugin (prose described repin's refusal set but omitted scripts/repin.mjs from sources — the gap that kept the gate from staling it; source added, prose updated, both notes pinned to abadcf4). Gates in worktree: node --test 244 pass, check-docs green, freshness green (31 notes fresh). PUSH BLOCKED by design: pre-push runs check-version-bump vs origin/main and grounding-wiki/ changed with no bump — the bump is reserved for the orchestrator (serialized across sibling PRs 68/69/70, at merge-readiness); hook bypass denied by the permission system. Branch tip 7fb7a48 is local-only past 60ed1df; bump in-branch then push.
<!-- SECTION:NOTES:END -->
