---
id: TASK-58
title: >-
  pdlc:sweep doctrine: merge-commit re-pin defeats the freshness gate (dishonest
  pin)
status: To Do
assignee: []
created_date: '2026-07-27 01:57'
labels:
  - downstream-bug-find
dependencies: []
priority: high
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The TASK-57 doctrine (pdlc/skills/sweep/SKILL.md:130-131,159-167; templates/runbook.md:67-72) instructs merging origin/main into a pin-carrying branch and mechanically re-pinning conflicted pins to the merge commit, with no requirement to re-verify note prose against the main-side diff. The freshness gate checks git log <pin>..HEAD -- <sources> (grounding-wiki/gates/freshness.mjs:78), so pin = merge-commit empties that range BY CONSTRUCTION. Scenario: a sibling PR lands on main changing a source of note N carried on the branch; the branch merges main in; the executor re-pins N per the doctrine; the gate goes green and the PR merges with N contradicting the code. Directly contradicts grounding-wiki/skills/wiki-update/SKILL.md:56-61 (never bump a pin without reading the diff; a dishonest pin is worse than a stale note). The unconditional post-history-move probe added by the same commit does not help — it passes once the pin is bumped. NOTE: downstream hosts inherit the hazard (promptworld records the same merge-in-and-repin convention); the fixed doctrine should state the safe procedure for hosts too.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sweep doctrine routes post-merge-in staleness through the wiki-update plan loop (RE-PIN-ONLY vs NEEDS-REVIEW classified against the main-side diff) instead of mechanical merge-commit re-pins
- [ ] #2 No text in sweep SKILL.md or templates/runbook.md instructs bumping a pin without reading the covered diff
- [ ] #3 docs/wiki/pdlc-sweep.md re-grounded to the amended doctrine
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.
<!-- SECTION:NOTES:END -->
