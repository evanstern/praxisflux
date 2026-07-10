---
id: TASK-11
title: >-
  codebase-to-course chrome hardening: version stamp, translation-block
  validator, upgrade path
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-10 05:37'
updated_date: '2026-07-10 05:37'
labels: []
dependencies: []
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upstream fixes for the chrome-drift handoff (docs/handoffs/course-chrome-drift-inline-visualizer.md): a course built downstream shipped the stale pre-inline side-by-side visualizer because (a) a stale global skill copy won unqualified resolution, (b) vendored chrome self-identifies nothing so drift is invisible, and (c) the inline engine's 1-tl-per-code-line contract fails silently. Additionally (operator request): translation blocks must never show bracket-unbalanced code excerpts — truncation must happen WITHIN a block via // … elision comment lines, with closing brackets always present. This task version-stamps the chrome, ships a self-contained translation-block validator (pairing + bracket balance, with a mechanical --fix that auto-closes), wires it into build.sh and the course gate, updates authoring guidance, documents the chrome-upgrade recipe for existing courses, and re-executes the TASK-6.5 split-brain decision on this machine (stale ~/.claude/skills symlink + checkout).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 styles.css and main.js open with a chrome version-stamp header naming the inline translation engine; gotchas.md tells vendored-copy users to check it
- [ ] #2 references/validate.mjs (self-contained, copied into course dirs) fails a translation block when .code-line count != .tl count, reporting block location and counts
- [ ] #3 validate.mjs fails a translation block whose code text (entity-decoded, string/comment-stripped) has unbalanced ()[]{} brackets; a documented per-block opt-out exists
- [ ] #4 validate.mjs --fix mechanically auto-closes an unbalanced block: appends an elision comment code-line plus closer code-line, with paired .tl notes, preserving 1:1 pairing
- [ ] #5 build.sh runs the validator before assembling index.html and fails the build on violations; SKILL.md copy list and output structure include validate.mjs
- [ ] #6 gates/course.mjs enforces the same pairing + balance checks on the built index.html (shared logic imported from validate.mjs, gate stays read-only)
- [ ] #7 interactive-elements.md and gotchas.md document the excerpt rule (elide from within with // … comment lines, never end mid-structure) and resolve the '1-2 code lines' vs 1:1 pairing contradiction
- [ ] #8 Chrome-upgrade recipe for existing courses documented (copy references over course dir, validate, rebuild)
- [ ] #9 Split-brain re-resolved on this machine per TASK-6.5: stale ~/.claude/skills/codebase-to-course symlink removed, ~/projects/codebase-to-course fast-forwarded to the archived head
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-11-chrome-hardening off main; commit the driving handoff doc.
2. Split-brain (machine-level, per recorded TASK-6.5 decision): rm ~/.claude/skills/codebase-to-course symlink; git -C ~/projects/codebase-to-course merge --ff-only origin/main (brings archive-notice 9953efe).
3. Version-stamp headers in references/styles.css + main.js ("chrome v2 — inline translation engine").
4. Write references/validate.mjs: exports checkTranslationBlocks(html) (pairing + bracket-balance via a string/comment-aware scanner over entity-decoded code-line text, data-validate="off" opt-out) + CLI over files + --fix (append elision comment line + closer line + paired .tl notes). Self-contained, no imports outside node stdlib.
5. Wire: build.sh runs validator before cat (fails build); SKILL.md copy list/structure gains validate.mjs; gates/course.mjs imports checkTranslationBlocks and adds its fails.
6. Guidance: interactive-elements.md excerpt rule + fix the "1-2 code lines" contradiction; gotchas.md chrome-version check + excerpt rule pointer; chrome-upgrade recipe in gotchas.md + plugin README.
7. Test: fixture HTML (good block, mismatched pairing, unbalanced brackets incl. template-literal SQL like the reported example) → validator + gate behave; --fix round-trips to passing; run gate on a real built course if one exists.
<!-- SECTION:PLAN:END -->
