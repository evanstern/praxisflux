---
id: TASK-82
title: >-
  demo rig: pin the live-thread narrative in CI — R4 asserts, demo-live-base,
  manifest-driven IDs, stage-4 app-test
status: To Do
assignee: []
created_date: '2026-07-27 17:52'
labels:
  - debt
dependencies: []
priority: medium
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Findings F4 + F3(part b) of refactor-triage run praxis-2026-07-27-17-33-15 (range b4e8e09..52b5abd) — evaluation report docs/reviews/team-review-praxis-2026-07-27-17-33-15.md §improved 3-4, triage record docs/reviews/refactor-triage-praxis-2026-07-27-17-33-15.md.

F4: nothing asserts spec R4's contract — the live task unmerged at stage-2 / merged at stage-3. The fingerprint only compares run A to run B (test/demo-rig.test.mjs:28); a fixture edit that checks stage-2's spec boxes reads as a spec-bridge WARNING, not a failure (spec-bridge/gates/bridge.mjs:193), so the gate matrix stays green while the demo's live thread silently dies. demo-live-base is asserted nowhere and silently no-ops if the ladder label "stage-2" is renamed (demo/generate.mjs:193). The manifest's narrative fields (taskIds, liveTask, prNumbers, debtTaskIds — demo/fixtures/manifest.json) are consumed by no code; the test hardcodes task-1..5 (test/demo-rig.test.mjs:56). Fix: three cheap asserts reusing existing plumbing — stage-2 bin/pet.mjs lacks --version while stage-3 has it; demo-live-base resolves to the stage-2 commit; board task IDs read from manifest taskIds/debtTaskIds. F9's dead fingerprint weight (trees — tag equality already implies tree equality, test/demo-rig.test.mjs:33) may be dropped in the same touch (not required).

F3b: no stage-4 gate watches bin/ — stage-4 runs wiki-freshness + spec-bridge only (demo/fixtures/manifest.json:43); freshness pins cover src/ but not bin/. Fix: add app-test to stage-4's gates (one manifest line); --check and the CI test then cover it automatically.

Shares no files with TASK-81's generator changes except demo/generate.mjs:193's label lookup — if swept in parallel with TASK-81, merge smallest-first per sweep doctrine.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CI asserts the R4 contract: stage-2 tree lacks the live task's change, stage-3 contains it, and demo-live-base resolves to the stage-2 commit
- [ ] #2 The test reads demo-board task IDs from the manifest (taskIds/debtTaskIds) instead of hardcoding
- [ ] #3 stage-4 gates include app-test in the manifest and the full matrix stays green
<!-- AC:END -->
