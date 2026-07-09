---
id: TASK-7.5
title: Wire educate's deck output to the self-contained verifier
status: To Do
assignee: []
created_date: '2026-07-09 19:28'
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
- [ ] #1 educate has a gate (or gate-run script) that executes lib/selfcontained.mjs checkHtml against a lesson's deck.html
- [ ] #2 The lesson DoD flow in educate's skill instructions invokes or references the deck check
- [ ] #3 A deck with an external script/link/font fails the check; the planted template passes
- [ ] #4 Verified against at least one real existing lesson deck
<!-- AC:END -->
