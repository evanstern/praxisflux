---
id: TASK-8
title: 'Ground the praxis repo itself: run wiki-build to generate docs/wiki'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 02:08'
updated_date: '2026-07-10 02:18'
labels: []
dependencies: []
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Run the grounding-wiki plugin's wiki-build skill against the praxis repo to produce its own code-grounded corpus in docs/wiki — per-concept notes pinned to the current commit, interlinked, indexed, and passing the freshness gate. Dogfoods TASK-4's plugin on the repo that ships it and gives downstream skills (codebase-to-course, analyze) a corpus to read.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/wiki exists with an index and per-concept notes covering the chassis (lib/), the plugins, and the docs/specs
- [x] #2 Every note pins sources to the current commit per docs/corpus-spec.md
- [x] #3 The freshness gate passes against the generated corpus
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-8-ground-praxis off main. 2. Run grounding-wiki:wiki-build against the repo to generate docs/wiki. 3. Verify freshness gate passes. 4. Commit, check ACs, finalize, push, open PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pinned corpus at 5934860. Wrote docs/wiki/INDEX.md (21-note plan) plus the 4 system notes (overview, grounded-corpus-spec, handoff-protocol, skill-patterns) by hand; fanned out 5 parallel subagents for the remaining 17 notes (chassis core, chassis support, knowledge plugins, teach/build plugins, repo ops). Freshness gate run pending.

All 21 notes written (4 by hand, 17 via 5 parallel subagents, each reading actual source). Freshness gate: OK, 21 notes fresh, exit 0. Extra check: every sources: path verified to exist on disk. node --test: 0 failures. Subagent ground-truth corrections folded in: dist/ is gitignored (not committed); pre-commit hook is tracked at .githooks/pre-commit but opt-in via core.hooksPath.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Generated the praxis repo's own grounding wiki at docs/wiki: INDEX.md + 21 notes (system concepts, chassis modules, all five plugins, repo ops), every note pinned to 5934860e2021d1d3b096d3c6d7a30bf5d434c003 with block-list sources per docs/corpus-spec.md. Verified with the grounding-wiki freshness gate (exit 0, 21 fresh), a sources-exist check, and node --test (green).
<!-- SECTION:FINAL_SUMMARY:END -->
