---
id: TASK-7.6
title: >-
  Borrowing seam: package codebase-to-course's interactive elements as optional
  toolkit modules
status: To Do
assignee: []
created_date: '2026-07-09 19:29'
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
- [ ] #1 lib/toolkit/ contains modules for the code-translation block, the quiz patterns (with the coverage rule), and at least one diagram idiom, each with usage guidance and token-schema-based styling
- [ ] #2 educate:lesson's instructions mention the optional toolkit tools and when to reach for them
- [ ] #3 codebase-to-course produces an unchanged-quality course standalone (no behavior regression; its gate still passes)
- [ ] #4 A sample educate deck slide using one borrowed module renders correctly with educate's palette and passes the deck check
<!-- AC:END -->
