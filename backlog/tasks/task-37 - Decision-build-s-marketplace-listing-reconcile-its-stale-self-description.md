---
id: TASK-37
title: 'Decision: build/''s marketplace listing + reconcile its stale self-description'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-23 16:59'
updated_date: '2026-07-26 15:15'
labels: []
dependencies: []
priority: low
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-35's vendored spec input (docs/handoffs/team-review-iteration-3-review.md, 'What should be removed' + open question 1): build/ is a discoverable marketplace entry whose own README still opens 'Scaffold — not yet implemented', and the repo README row echoes '(scaffold — split out of educate)'. Since that review pinned e2a99b9, TASK-29 shipped the real implement skill (build/skills/), so the stub claim is stale — but the plugin still has no gates/, scripts/, or hooks/. Decide: (a) keep it listed as a skill-only plugin (legitimate per the pdlc precedent of opting out of lifecycle machinery) and fix both READMEs to describe what actually ships, or (b) delist it from the marketplace until it carries its own gate surface. Either branch must leave the catalog, README, and build/README.md telling one consistent story. If the outcome is decision-plus-doc-fixes only, note the task-courses decision-only exemption boundary: README edits are artifacts, so a per-task course is still due.

Spec: specs/011-build-listing-decision
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The decision (keep-listed vs delist) is recorded in the task with rationale referencing the review's open question
- [x] #2 build/README.md no longer claims 'not yet implemented' anything that TASK-29 shipped; the repo README row matches
- [x] #3 Marketplace catalog, check-docs, and version bump (per docs/releasing.md if released surface changes) all green after the change
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 011-build-listing-decision (hand-authored)
2. spec-bridge:link
3. Dispatch: record the operator decision (keep listed as skill-only plugin, per sweep sign-off 2026-07-26) with rationale referencing the review's open question; fix build/README.md (drop stale scaffold claims for what TASK-29 shipped) + repo README row to one consistent story
4. Version bump (build/README.md is released surface -> marketplace 0.19.0); gates; wiki re-pins; PR; merge
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 3 (docs/design/board-clearing-runbook.md), serial before TASK-40. Tier: default implementer (decision execution + doc fixes). Decision was made by the operator at sweep sign-off: keep listed, fix docs (pdlc skill-only precedent).

DECISION (operator, sweep sign-off 2026-07-26; answers review open question 1 in docs/handoffs/team-review-iteration-3-review.md): (a) KEEP build/ LISTED as a skill-only plugin. Rationale: TASK-29 shipped /build:implement for real (the stub claim was stale, not the skill); the pdlc precedent legitimizes plugins that opt out of lifecycle machinery; delisting would hide a working skill behind a doc problem. Executed: build/README.md rewritten (implement leg + explicit skill-only-by-design paragraph), repo README build row matches, manifest/catalog already truthful (no regen needed). Marketplace 0.19.0. build-plugin + overview notes re-verified (scaffold framing gone); lockstep re-pins honest; CAPSULES regenerated. 186 tests, check-docs, wiki-freshness, bump gate green. Left for TASK-40 per scope boundary: the README status blockquote still says 'Seven plugins ... build (a scaffold)' — that sentence carries the plugin count TASK-40 owns.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decision executed: build/ stays a listed, skill-only plugin (operator choice at sweep sign-off; rationale on the task — TASK-29 shipped the implement skill for real, pdlc precedent legitimizes the shape, delisting would hide working software behind a doc bug). build/README.md rewritten to the real story with an explicit skill-only-by-design paragraph; repo README build row matches; manifest and catalog were already truthful. Marketplace 0.19.0; build-plugin + overview wiki notes re-verified with the scaffold framing gone. The one remaining stale sentence (README status blockquote's 'seven plugins ... build (a scaffold)') is TASK-40's count-fixing scope, deliberately left.
<!-- SECTION:FINAL_SUMMARY:END -->
