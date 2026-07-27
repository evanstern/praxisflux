---
id: TASK-63
title: >-
  educate<->build handoff seam: nobody owns writing handoff.returned; loose
  HANDOFF.md doctrine contradictions; dangling protocol refs
status: To Do
assignee: []
created_date: '2026-07-27 01:57'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The recorded contract has no owner for the evidence the gate demands: educate/skills/lesson/SKILL.md:80-82 asserts the build plugin sets handoff.returned=true and status built, but build/skills/implement/SKILL.md contains no instruction to touch progress.json — it only writes the .handoff/ response. A delegated build run in its own session therefore leaves the lesson at spec-d with handoff.returned unset, and educate/gates/dod.mjs:99-100 blocks any status >= built forever. Compounding doctrine drift: lesson SKILL.md:54-55 names loose HANDOFF.md / POST_BUILD_HANDOFF.md lifecycle artifacts while :74-76 forbids exactly those loose files; educate/templates/CLAUDE.md:14-15,21-22 has the same internal contradiction; and gates/dod.mjs:16-17 still derives artifacts.handoff/postBuild from those loose filenames on disk, blessing the drift. Also: build/skills/implement/SKILL.md:11 and lesson SKILL.md:76 point at docs/handoff-protocol.md, which does not exist under either plugin root (only at repo root, outside what the marketplace serves) — from a user project the pointer resolves to nothing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exactly one side of the seam owns the progress.json write (handoff.returned + status), and that side instructs it in its skill
- [ ] #2 Handoff artifact doctrine is .handoff/-only and internally consistent across lesson SKILL, planted template, and dod.mjs artifact derivation
- [ ] #3 handoff-protocol doc references resolve from an installed plugin context
- [ ] #4 A delegated-build round trip (educate hands off, build returns, gate passes at built) is covered by a test or scripted fixture
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.
<!-- SECTION:NOTES:END -->
