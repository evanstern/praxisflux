---
id: TASK-11
title: >-
  codebase-to-course chrome hardening: version stamp, translation-block
  validator, upgrade path
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 05:37'
updated_date: '2026-07-10 05:47'
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
- [x] #1 styles.css and main.js open with a chrome version-stamp header naming the inline translation engine; gotchas.md tells vendored-copy users to check it
- [x] #2 references/validate.mjs (self-contained, copied into course dirs) fails a translation block when .code-line count != .tl count, reporting block location and counts
- [x] #3 validate.mjs fails a translation block whose code text (entity-decoded, string/comment-stripped) has unbalanced ()[]{} brackets; a documented per-block opt-out exists
- [x] #4 validate.mjs --fix mechanically auto-closes an unbalanced block: appends an elision comment code-line plus closer code-line, with paired .tl notes, preserving 1:1 pairing
- [x] #5 build.sh runs the validator before assembling index.html and fails the build on violations; SKILL.md copy list and output structure include validate.mjs
- [x] #6 gates/course.mjs enforces the same pairing + balance checks on the built index.html (shared logic imported from validate.mjs, gate stays read-only)
- [x] #7 interactive-elements.md and gotchas.md document the excerpt rule (elide from within with // … comment lines, never end mid-structure) and resolve the '1-2 code lines' vs 1:1 pairing contradiction
- [x] #8 Chrome-upgrade recipe for existing courses documented (copy references over course dir, validate, rebuild)
- [x] #9 Split-brain re-resolved on this machine per TASK-6.5: stale ~/.claude/skills/codebase-to-course symlink removed, ~/projects/codebase-to-course fast-forwarded to the archived head
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Split-brain: symlink removed, stale checkout fast-forwarded ff8837e -> 9953efe (archive notice). Handoff doc + task committed on task-11-chrome-hardening.

validate.mjs written + exercised on a fixture: valid block passes; 3v2 pairing fails; the reported truncated-SQL block fails with unclosed ( and [ at their open lines; --fix appends elision comment + '])' + two paired notes and the block revalidates clean; data-validate=off skips.

build.sh + course.mjs wired; chrome stamped v2; gate caught 2 real violations in docs/course (module 04 stray-}/unclosed-{, module 05 unclosed function brace) — fixed per the excerpt rule, rebuilt, gate green. SKILL.md copy list is 5 files now.

Final verification: fixture fails as expected (pairing + the reported truncated-SQL case), --fix'd copy fails only on the deliberate pairing case, course gate green on docs/course with absolute path. No repo-level test suite to run; gates invoked directly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Chrome drift + broken code excerpts are now mechanically prevented. references/validate.mjs (self-contained, copied into every course like main.js) enforces two contracts per translation block: exactly one .tl per .code-line, and bracket-balanced code (entity-decoded, string/comment-aware scanner; sq/dq strings end at newlines, template literals span them, # comments only before whitespace so CSS hex/#include stay code). --fix auto-closes fixable blocks (elision comment line + closer line + two paired notes); data-validate=off opts out pseudo-code. build.sh validates before assembling; gates/course.mjs imports the same check so the gate fails what the build would. Chrome (styles.css/main.js) is version-stamped 'chrome v2 — inline translation engine'; gotchas.md/README document the stamp check and the mechanical upgrade recipe, dogfooded on docs/course — where the new gate immediately caught two real unbalanced excerpts (04-handoffs stray-}/unclosed-{, 05-one-copy unclosed function), both re-authored per the new excerpt rule, rebuilt, gate green. interactive-elements.md's contradictory '1-2 code lines per note' rule replaced with the 1:1 contract. Split-brain re-resolved per TASK-6.5: stale ~/.claude/skills symlink removed, archived checkout fast-forwarded to 9953efe.
<!-- SECTION:FINAL_SUMMARY:END -->
