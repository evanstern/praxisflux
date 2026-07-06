---
id: TASK-2
title: 'Refactor: uniform gates/ vs scripts/ convention across plugins'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-06 19:53'
updated_date: '2026-07-06 19:57'
labels:
  - chassis
  - refactor
dependencies: []
priority: medium
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make gate placement consistent: gates/ = read-only verification logic (+ skill-invoked gate CLI); scripts/ = operational entrypoints (Stop-hook shim gate.sh + stop.mjs, and state-mutating tracker CLIs). research already conforms. Extract educate's read-only DoD checker into educate/gates/dod.mjs; scripts/progress.mjs (mutating tracker) and scripts/stop.mjs import it. Remove the redundant educate/scripts/sync-version.mjs (superseded by repo-level tooling). Document the rule in docs/skill-patterns.md. Keep tests green + educate parity intact.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 educate has gates/dod.mjs holding the read-only DoD verification; scripts/ holds only hook wiring + the mutating progress tracker
- [x] #2 gates/ never writes to disk; the sync/mutation stays in scripts/progress.mjs
- [x] #3 docs/skill-patterns.md states the gates/ vs scripts/ rule
- [x] #4 tests pass and educate --check stays clean on the real project (parity preserved)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create educate/gates/dod.mjs — read-only DoD verification: consts (ARTIFACT_FILES, STATES), helpers (requiredArtifacts, isDelegated, hasReturnLegResidue, lifecycleFor), topicDoDProblems(topicDir, progress) [folder-missing + lifecycle status<=artifacts + delegated evidence + residue + cursor], topicsWithProgress, gateProblemsForProject. NO writes. 2. Rewrite scripts/progress.mjs to own only CLI + resolveTopicsDir + sync(mutate)/staleness, importing DoD from ../gates/dod.mjs. 3. Point scripts/stop.mjs at ../gates/dod.mjs. 4. Update the 2 tests' imports to educate/gates/dod.mjs. 5. Delete scripts/sync-version.mjs (repo-level supersedes). 6. Document the gates/ vs scripts/ rule in docs/skill-patterns.md. 7. Tests + real-project parity + pre-commit checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Extracted educate's read-only DoD verification into educate/gates/dod.mjs (consts, requiredArtifacts, isDelegated, hasReturnLegResidue, lifecycleFor, topicDoDProblems, topicsWithProgress, gateProblemsForProject) — never writes. scripts/progress.mjs slimmed to the operational tracker: root resolution + derive/sync (the only writer) + staleness + CLI, importing DoD from ../gates/dod.mjs. stop.mjs + both tests repointed to gates/dod.mjs. Removed the superseded educate-local self-build layer: scripts/sync-version.mjs, scripts/make-plugin.mjs, educate.plugin-spec.json, package.json (build/version/package are repo-level now). Documented the gates/ vs scripts/ rule in docs/skill-patterns.md §5. Verified: 19/19 tests; educate --check AND --gate clean on ~/Claude/Projects/Education (parity); Stop hook still blocks premature done; vendored dist build rewrites gates/dod.mjs imports and runs clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Uniform gates/ vs scripts/ convention: gates/ = read-only verification (never writes), scripts/ = hook wiring + mutating tracker. educate gained gates/dod.mjs mirroring research/gates/; removed educate's orphaned self-build layer (package.json, make-plugin.mjs, plugin-spec, sync-version.mjs) now handled repo-level. Rule documented. Tests + parity + vendored build all green.
<!-- SECTION:FINAL_SUMMARY:END -->
