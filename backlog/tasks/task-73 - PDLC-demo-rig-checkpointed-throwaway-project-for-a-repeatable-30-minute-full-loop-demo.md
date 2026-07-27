---
id: TASK-73
title: >-
  PDLC demo rig: checkpointed throwaway project for a repeatable 30-minute
  full-loop demo
status: To Do
assignee: []
created_date: '2026-07-27 16:17'
labels: []
dependencies: []
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A demo rig that shows the entire PDLC to a coworker in ~30 minutes without waiting on live sweeps. Design (operator-ratified 2026-07-27): a generator script in this repo materializes a throwaway demo project (tiny Node CLI app, tamagotchi for continuity with TASK-25) as a real git repo whose HISTORY is the demo — one tag per stage: stage-0 bare app → stage-1 grounded (research vault branch + docs/wiki built and pinned) → stage-2 planned (board tasks, Spec Kit specs, spec-bridge links, signed-off sweep runbook) → stage-3 swept (merged PRs, board synced, wiki re-pinned) → stage-4 triaged (refactor-triage record + debt cards). The presenter time-travels between stages in seconds; every artifact at every stage is real, captured once from genuine plugin runs. Live moments are the fast deterministic ones: break the freshness gate on camera, have the spec-bridge gate block a dishonest status, card a debt finding. One tiny pre-specced task sweeps for REAL in the background during the demo (kicked off ~minute 5, its merged-PR twin already exists in stage-3 as the canned fallback). Remote: a scratch GitHub sandbox repo the reset script force-pushes, so live PRs are genuine. The rig hooks into the PDLC itself: CI regenerates the demo and asserts each stage passes its own gates; a wiki note pins the rig with the demoed skills as sources so the freshness gate flags drift. Rationale: repeatable (reset = regenerate, identical task IDs and narrative every run), re-demo-able without re-orientation, and drift-proof because the repo's own enforcement covers it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A single generator/reset command materializes the demo project from tracked fixtures as a fresh git repo with a tag per PDLC stage (0 bare, 1 grounded, 2 planned, 3 swept, 4 triaged) and can jump to any stage in seconds
- [ ] #2 Every stage's artifacts are real captures from genuine plugin runs, and each stage passes its own gates when checked out (freshness gate green at stages 1/3/4; spec-bridge derivation consistent at 2/3)
- [ ] #3 Scratch GitHub sandbox remote wired: reset force-pushes stage state, canned history carries real merged PRs, and the live sweep opens a genuine PR there
- [ ] #4 Live-thread support: one tiny pre-specced one-file task exists unmerged at stage-2 ready to sweep live, and stage-3 contains the same task merged as the canned fallback
- [ ] #5 A 30-minute runsheet doc scripts the demo: stage walk order, the live gate-break and spec-bridge-block moments, the background live task kickoff and close, refactor-triage (headless policy run or live debt-carding), and the fallback pivot per live moment
- [ ] #6 A CI test regenerates the demo repo and asserts the stage tags exist and per-stage gates pass, so the demo cannot rot silently
- [ ] #7 A docs/wiki note pins the rig (generator, fixtures, runsheet) listing the demoed skill files as sources, so the freshness gate flags the demo when those skills change
- [ ] #8 Repeatability proven: two consecutive resets yield identical stage state (same demo-board task IDs, same tags, same narrative)
<!-- AC:END -->
