---
id: TASK-7.6
title: >-
  Borrowing seam: package codebase-to-course's interactive elements as optional
  toolkit modules
status: Done
assignee:
  - '@claude'
created_date: '2026-07-09 19:29'
updated_date: '2026-07-09 20:56'
labels: []
dependencies:
  - TASK-7.1
  - TASK-7.2
parent_task_id: TASK-7
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
codebase-to-course owns several teaching tools no sibling can currently use: the code-to-plain-English translation block (interactive-elements.md incl. the comments-on-top reformatter, plus syntax-highlight tokens in design-system.md), the quiz suite (multiple-choice, drag-and-drop, spot-the-bug, scenario; design rules incl. the coverage rule in content-philosophy.md), and HTML/CSS flow/architecture/file-tree diagrams. Package these as optional lib/toolkit/ modules (guidance + copy-paste snippets styled via the shared token schema so they inherit the consumer's palette), and add a short 'optional visual tools' pointer in educate:lesson's skill instructions so a lesson deck can pull in, e.g., a code-translation block or a spot-the-bug quiz. c2c must remain fully functional standalone: its references either remain canonical with toolkit re-exports, or point at the toolkit with the vendored copy present either way. Do not force any tool into educate's flow — opt-in only, with graceful degradation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 lib/toolkit/ contains modules for the code-translation block, the quiz patterns (with the coverage rule), and at least one diagram idiom, each with usage guidance and token-schema-based styling
- [x] #2 educate:lesson's instructions mention the optional toolkit tools and when to reach for them
- [x] #3 codebase-to-course produces an unchanged-quality course standalone (no behavior regression; its gate still passes)
- [x] #4 A sample educate deck slide using one borrowed module renders correctly with educate's palette and passes the deck check
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Principle (established in 7.3): courses keep their prebuilt engines (main.js/styles.css, verbatim invariant); the toolkit ships PORTABLE, self-contained variants for decks/briefings, token-styled so they inherit the consumer's palette. c2c's references stay the canonical course-native authoring guides.
1. lib/toolkit/code-translation.md — the pattern + rules distilled from c2c (verbatim code, pre-wrap/no h-scroll, choose short punchy snippets, plain-English note above its code line) + a zero-JS portable snippet (comments-on-top: styled .note lines interleaved in a token-styled <pre>), + pointer to c2c's engine for courses.
2. lib/toolkit/quiz-patterns.md — the coverage rule (hard), what-to-quiz hierarchy (scenarios > debugging > architecture > tracing), what NOT to quiz, tone rules; portable zero-JS multiple-choice snippet using <details>/<summary> reveal; pointer to c2c's graded quiz engine for courses.
3. lib/toolkit/diagrams.md — the HTML/CSS diagram idiom (flow steps with arrow separators; annotated file tree), token-styled portable CSS; pointer to c2c's animated variants.
4. educate lesson SKILL.md: an 'optional visual tools' paragraph in the deck-building step (opt-in, with the no-toolkit fallback).
5. README.md module table -> shipped.
6. Test test/toolkit-borrow.test.mjs: compose a deck from the template + one borrowed code-translation slide + one quiz slide (snippets straight from the modules), run it through educate's DoD gate fixture -> zero problems (proves a borrowed module keeps a deck self-contained under educate's palette).
7. Suite + sync --check; verify c2c standalone untouched (no source changes beyond none).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Three portable modules authored, each following the 7.3-established split (courses keep prebuilt engines; toolkit ships the portable variant, token-styled): code-translation.md (verbatim-code/no-h-scroll/one-note-per-line rules + a zero-JS comments-on-top panel), quiz-patterns.md (the coverage rule verbatim-in-spirit from c2c's content-philosophy, what-to-quiz hierarchy, tone rules + a zero-JS details/summary reveal quiz), diagrams.md (flow-of-steps boxes + annotated file tree, with the label-the-why and 3-5-step rules). Each ends with an 'In codebase-to-course' section routing course authoring to the prebuilt engines — c2c source untouched this task (0 changes), so no regression by construction; course-gate fixture tests still green. educate lesson SKILL.md gained an 'Optional visual tools for the deck' paragraph at the deck-building step (opt-in, fallback stated). AC4 verified mechanically: test/toolkit-borrow.test.mjs extracts the actual fenced snippets from both modules, splices them into the planted deck template as two extra slides, and runs the result through educate's full DoD gate -> zero problems (self-contained, educate palette via shared tokens). Suite 40/40.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
codebase-to-course's single-owner teaching tools are now borrowable: lib/toolkit gained code-translation.md, quiz-patterns.md (incl. the coverage rule), and diagrams.md — portable zero-JS, token-styled variants with c2c's prebuilt engines staying canonical for courses (c2c source untouched). educate:lesson advertises them as opt-in deck tools with fallbacks. Proven by a new test that splices the modules' real snippets into the deck template and passes educate's full gate. 40/40 tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
