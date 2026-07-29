---
id: TASK-73
title: >-
  PDLC demo rig: checkpointed throwaway project for a repeatable 30-minute
  full-loop demo
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 16:17'
updated_date: '2026-07-29 14:14'
labels: []
dependencies: []
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
<!-- SECTION:DESCRIPTION:BEGIN -->
A demo rig that shows the entire PDLC to a coworker in ~30 minutes without waiting on live sweeps. Design (operator-ratified 2026-07-27): a generator script in this repo materializes a throwaway demo project (tiny Node CLI app, tamagotchi for continuity with TASK-25) as a real git repo whose HISTORY is the demo — one tag per stage: stage-0 bare app → stage-1 grounded (research vault branch + docs/wiki built and pinned) → stage-2 planned (board tasks, Spec Kit specs, spec-bridge links, signed-off sweep runbook) → stage-3 swept (merged PRs, board synced, wiki re-pinned) → stage-4 triaged (refactor-triage record + debt cards). The presenter time-travels between stages in seconds; every artifact at every stage is real, captured once from genuine plugin runs. Live moments are the fast deterministic ones: break the freshness gate on camera, have the spec-bridge gate block a dishonest status, card a debt finding. One tiny pre-specced task sweeps for REAL in the background during the demo (kicked off ~minute 5, its merged-PR twin already exists in stage-3 as the canned fallback). Remote: a scratch GitHub sandbox repo the reset script force-pushes, so live PRs are genuine. The rig hooks into the PDLC itself: CI regenerates the demo and asserts each stage passes its own gates; a wiki note pins the rig with the demoed skills as sources so the freshness gate flags drift. Rationale: repeatable (reset = regenerate, identical task IDs and narrative every run), re-demo-able without re-orientation, and drift-proof because the repo's own enforcement covers it.

Spec: specs/034-demo-rig
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A single generator/reset command materializes the demo project from tracked fixtures as a fresh git repo with a tag per PDLC stage (0 bare, 1 grounded, 2 planned, 3 swept, 4 triaged) and can jump to any stage in seconds
- [x] #2 Every stage's artifacts are real captures from genuine plugin runs, and each stage passes its own gates when checked out (freshness gate green at stages 1/3/4; spec-bridge derivation consistent at 2/3)
- [x] #3 Scratch GitHub sandbox remote wired: reset force-pushes stage state, canned history carries real merged PRs, and the live sweep opens a genuine PR there
- [x] #4 Live-thread support: one tiny pre-specced one-file task exists unmerged at stage-2 ready to sweep live, and stage-3 contains the same task merged as the canned fallback
- [x] #5 A 30-minute runsheet doc scripts the demo: stage walk order, the live gate-break and spec-bridge-block moments, the background live task kickoff and close, refactor-triage (headless policy run or live debt-carding), and the fallback pivot per live moment
- [x] #6 A CI test regenerates the demo repo and asserts the stage tags exist and per-stage gates pass, so the demo cannot rot silently
- [x] #7 A docs/wiki note pins the rig (generator, fixtures, runsheet) listing the demoed skill files as sources, so the freshness gate flags the demo when those skills change
- [x] #8 Repeatability proven: two consecutive resets yield identical stage state (same demo-board task IDs, same tags, same narrative)
- [x] #9 Spec phase: Spec
- [x] #10 Spec phase: Implement
- [x] #11 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
sweep dispatch (2026-07-27): tier = default implementer — design operator-ratified with 8 explicit ACs, no open architecture decisions; flagged in runbook as largest single-task footprint (fixture capture drives real plugin runs); escalation is an operator checkpoint. Spec: specs/034-demo-rig, runbook docs/design/demo-rig-runbook.md (signed off 2026-07-27).

operator checkpoint resolved (2026-07-27): sandbox remote = evanstern/praxisflux-demo-sandbox (private, created via gh; throwaway, force-pushed on reset). CI never touches it.

implementer (2026-07-27): T002-T007 complete on task-73-demo-rig. Rig: demo/generate.mjs (deterministic replay, stage-0..4 tags, --stage/--reset/--check/--remote/--snapshot), fixtures captured from genuine plugin runs (wiki-build, research-vault, spec-bridge link/sync, real mini-sweep = sandbox PRs #1-#3 merged incl. live task-3's twin, headless refactor-triage -> demo debt cards task-4/5). Gate matrix green on fresh generate (app-test 0/3, wiki-freshness 1/3/4, spec-bridge 2/3/4); double-generate ref-identical (R8). test/demo-rig.test.mjs rides node --test (253/253) + catalog bullet; RUNSHEET.md rehearsed (both live gate moments verified verbatim). demo-rig wiki note pinned w/ demoed skills as sources; README updated. check-docs green, freshness 34/34, check-version-bump: no bump required.

orchestrator verification (2026-07-27): node --test 253/253 (incl. demo-rig test), check-docs green, no bump required (verdict believed), wiki-freshness 34 fresh, spec-bridge 34 ok; demo --check matrix all stages green on fresh generate; sandbox PRs #1-#3 merged + stage-0..4 tags verified via gh. T008 ticked.

spec-bridge sync: Spec: 2/2 · Implement: 6/6 · Prove: 2/2 — status In Progress → Done

2026-07-29: operator decision — demo rig removed from the repo (demo/ + test/demo-rig.test.mjs + wiki note demo-rig; README/INDEX/CAPSULES/catalog updated). The task's paper trail (specs/034, runbook, triage records) stays; sandbox repo left as-is per operator. Demo debt cards TASK-81..83 archived as moot.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Spec: 2/2 · Implement: 6/6 · Prove: 2/2). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
