---
id: TASK-7.5
title: Wire educate's deck output to the self-contained verifier
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:28'
updated_date: '2026-07-09 19:51'
labels: []
dependencies: []
parent_task_id: TASK-7
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
lib/selfcontained.mjs is already the shared enforcement for the self-contained-page contract — research/gates/artifact.mjs and codebase-to-course/gates/course.mjs both import checkHtml from it — but educate only STATES the rule in deck.html's header comment ('Single self-contained file. No CDN. Works offline') and never runs the verifier. Close the gap: add a deck check to educate's gate/scripts surface (following the gates/ convention from TASK-2) that runs checkHtml against a lesson's deck.html, and mention it in educate:lesson's Definition-of-Done flow. educate allows zero external hosts (no Google Fonts exception here). This matches the chassis principle that status can't exceed proven artifacts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 educate has a gate (or gate-run script) that executes lib/selfcontained.mjs checkHtml against a lesson's deck.html
- [x] #2 The lesson DoD flow in educate's skill instructions invokes or references the deck check
- [x] #3 A deck with an external script/link/font fails the check; the planted template passes
- [x] #4 Verified against at least one real existing lesson deck
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. gates/dod.mjs: in topicDoDProblems' lesson loop, when <lessonDir>/deck.html exists, run checkHtml (lib/selfcontained.mjs, read-only — respects the gates-never-write rule) and push each fail as '<id>: deck.html is not self-contained — <fail>'. Fails only (external loads); warns stay non-blocking. This single hook point propagates to the Stop hook (scripts/stop.mjs) AND progress.mjs --check/--all --gate with no other wiring.
2. skills/lesson/SKILL.md: extend the Definition-of-Done gate section — a deck on disk must pass the shared self-contained verifier (zero external hosts; educate has no Google-Fonts exception); the gate enforces it.
3. Test in test/handoff.test.mjs (home of the existing educate-gate fixture tests): fixture lesson deck with an external <script src> yields a deck problem; the planted template deck passes clean.
4. Verify on the real project: node educate/scripts/progress.mjs --all --gate --root ~/neumo/learn (read-only) — expect existing real decks to pass; note any that don't.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Wired the deck content check into gates/dod.mjs topicDoDProblems (single hook point): any deck.html on disk is run through lib/selfcontained.mjs checkHtml; fails become blocking problems ('<id>: deck.html is not self-contained — …'), warns stay advisory, unreadable decks are flagged. Because both the Stop hook (scripts/stop.mjs) and progress.mjs --check/--all --gate flow through topicDoDProblems, no other wiring was needed. Chose 'deck present ⇒ must be self-contained' over 'only at decked status': the template is compliant from planting, so an external ref is always a regression, and the deck's own header states the contract. SKILL.md DoD section documents it (educate = zero external hosts, no Google-Fonts exception). New test file test/educate-deck-selfcontained.test.mjs (CDN script+font deck → 2 problems; planted template → clean). Verified read-only against the real project ~/neumo/learn: all 6 topics pass, no false positives on ~10 real decks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
educate's DoD gate now enforces the self-contained contract on decks: gates/dod.mjs runs the shared verifier (lib/selfcontained.mjs) over every deck.html on disk, blocking on external loads — propagating automatically to the Stop hook and progress.mjs --check/--gate. Documented in lesson SKILL.md's DoD section. Verified by 2 new tests (fixture with CDN script/font fails; planted template passes) plus a read-only run over the real ~/neumo/learn project (6 topics clean). Full suite 37/37 green.
<!-- SECTION:FINAL_SUMMARY:END -->
