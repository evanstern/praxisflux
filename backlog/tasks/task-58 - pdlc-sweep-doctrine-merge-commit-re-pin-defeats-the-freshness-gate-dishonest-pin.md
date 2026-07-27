---
id: TASK-58
title: >-
  pdlc:sweep doctrine: merge-commit re-pin defeats the freshness gate (dishonest
  pin)
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:57'
updated_date: '2026-07-27 02:46'
labels:
  - downstream-bug-find
dependencies: []
priority: high
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The TASK-57 doctrine (pdlc/skills/sweep/SKILL.md:130-131,159-167; templates/runbook.md:67-72) instructs merging origin/main into a pin-carrying branch and mechanically re-pinning conflicted pins to the merge commit, with no requirement to re-verify note prose against the main-side diff. The freshness gate checks git log <pin>..HEAD -- <sources> (grounding-wiki/gates/freshness.mjs:78), so pin = merge-commit empties that range BY CONSTRUCTION. Scenario: a sibling PR lands on main changing a source of note N carried on the branch; the branch merges main in; the executor re-pins N per the doctrine; the gate goes green and the PR merges with N contradicting the code. Directly contradicts grounding-wiki/skills/wiki-update/SKILL.md:56-61 (never bump a pin without reading the diff; a dishonest pin is worse than a stale note). The unconditional post-history-move probe added by the same commit does not help — it passes once the pin is bumped. NOTE: downstream hosts inherit the hazard (promptworld records the same merge-in-and-repin convention); the fixed doctrine should state the safe procedure for hosts too.

Spec: specs/019-sweep-honest-repin
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sweep doctrine routes post-merge-in staleness through the wiki-update plan loop (RE-PIN-ONLY vs NEEDS-REVIEW classified against the main-side diff) instead of mechanical merge-commit re-pins
- [x] #2 No text in sweep SKILL.md or templates/runbook.md instructs bumping a pin without reading the covered diff
- [x] #3 docs/wiki/pdlc-sweep.md re-grounded to the amended doctrine
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 019-sweep-honest-repin (hand-authored spec/plan/tasks on branch task-58-sweep-honest-repin) drives. 1. Inventory every re-pin instruction in sweep SKILL.md + templates/runbook.md. 2. Rewrite post-merge-in reconciliation to route through the wiki-update plan loop (RE-PIN-ONLY vs NEEDS-REVIEW classified against the main-side diff); delete every mechanical bump-without-reading instruction. 3. State the safe procedure for downstream hosts. 4. Versions + wiki re-ground (docs/wiki/pdlc-sweep.md) + gates. See specs/019-sweep-honest-repin/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane A): tier = default implementer — prose/doctrine amendment, well-scoped by three ACs; no code paths touched beyond skill text and wiki note.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sweep doctrine amended to honest re-pins (PR pending merge; branch task-58-sweep-honest-repin). pdlc/skills/sweep/SKILL.md step 7 + concurrency doctrine and templates/runbook.md no longer instruct mechanical merge-commit re-pins: post-merge-in staleness now routes through the wiki-update plan loop — every stale/conflicted pin classified against the main-side diff over the note's sources as RE-PIN-ONLY vs NEEDS-REVIEW (prose re-verified before any bump); the merge commit stays the re-pin target, never the justification. Downstream-host paragraph states the same safe procedure for hosts that inherited the TASK-57 convention (promptworld sibling: their TASK-162). docs/wiki/pdlc-sweep.md re-grounded to the amended doctrine and re-pinned to 92ab119; the lockstep version bump staled 11 sibling notes, all classified and re-pinned per the new doctrine itself (7 RE-PIN-ONLY, 4 NEEDS-REVIEW re-verified). Versions: sweep skill 0.6.0 → 0.7.0, marketplace 0.28.0. Gates green at HEAD: node --test 210/210, check-docs, wiki freshness (29 notes), bump gate.
<!-- SECTION:FINAL_SUMMARY:END -->
