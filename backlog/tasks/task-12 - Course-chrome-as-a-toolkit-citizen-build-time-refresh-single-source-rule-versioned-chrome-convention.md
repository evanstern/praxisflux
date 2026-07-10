---
id: TASK-12
title: >-
  Course chrome as a toolkit citizen: build-time refresh, single-source rule,
  versioned-chrome convention
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-10 05:59'
updated_date: '2026-07-10 06:03'
labels: []
dependencies:
  - TASK-11
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finishes the chrome-drift handoff's item 5 along the lines approved by Evan (2026-07-10), with the toolkit registration explicitly wanted. Today course chrome (styles.css/main.js/_footer.html/build.sh/validate.mjs) is copied into each course dir and orphaned — nothing refreshes it and nothing indexes it as shared visual machinery. Three moves: (1) build.sh refreshes chrome from the plugin references at build time when reachable (CLAUDE_PLUGIN_ROOT in-session, C2C_REFERENCES override), local copies as standalone fallback; (2) the skill names the plugin references/ as the ONLY legitimate chrome source — existing courses are snapshots, never templates; (3) the chrome joins the lib/toolkit convention as a plugin-owned, version-stamped module: indexed in lib/toolkit/README.md, chrome-version convention documented in docs/skill-patterns.md, and version consistency mechanically enforced — validate.mjs carries CHROME_VERSION and fails a course dir whose chrome files are unstamped (= v1) or mixed-version, wired into build.sh and the course gate so fossilized chrome can no longer pass silently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 build.sh refreshes styles.css, main.js, _footer.html, validate.mjs from the plugin references when CLAUDE_PLUGIN_ROOT or C2C_REFERENCES resolves (never _base.html, never itself), and still builds standalone from local copies when neither is set
- [x] #2 SKILL.md names the plugin references/ as the only legitimate chrome source; copying chrome from another course is explicitly forbidden
- [x] #3 validate.mjs exports CHROME_VERSION and checkChrome(dir): unstamped chrome files fail as v1 with the upgrade recipe named; version-mixed chrome files fail; wired into build.sh (--chrome-dir .) and gates/course.mjs
- [ ] #4 lib/toolkit/README.md indexes the course chrome as a plugin-owned versioned module; docs/skill-patterns.md documents the chrome-version convention (stamp format, bump rule, refresh + gate enforcement)
- [ ] #5 Verified: docs/course still gates green; a fixture course dir with unstamped and mixed-version chrome fails with actionable messages; the refresh path exercised via C2C_REFERENCES
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-12-chrome-toolkit off task-11-chrome-hardening (stacked; PR base retargets when #13 merges).
2. validate.mjs: export CHROME_VERSION = 2 + checkChrome(dir) (stamp regex on styles.css/main.js; missing = v1 fail w/ upgrade recipe, mismatch = mixed-chrome fail); CLI gains --chrome-dir <dir>.
3. build.sh: chrome refresh block (C2C_REFERENCES > CLAUDE_PLUGIN_ROOT/skills/codebase-to-course/references; copies styles.css main.js _footer.html validate.mjs, never _base.html or itself), then validate with --chrome-dir .
4. gates/course.mjs: call checkChrome(courseDir) alongside checkTranslationBlocks.
5. SKILL.md Step 1 + gotchas.md: single-source rule (references/ only, courses are snapshots not templates; note the check is now automatic).
6. lib/toolkit/README.md: index the chrome as plugin-owned versioned module; docs/skill-patterns.md: chrome-version convention (stamp format, bump rule, enforcement points).
7. Verify: fixture course dirs (unstamped, mixed) fail; C2C_REFERENCES refresh exercised; docs/course rebuild + gate green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Found the course-gate test failing (fixture predates TASK-11 contracts; pre-commit suite hadn't caught it on this branch) — fixture upgraded, 13 new tests across gate + validator unit level, node --test 69/69 green.
<!-- SECTION:NOTES:END -->
