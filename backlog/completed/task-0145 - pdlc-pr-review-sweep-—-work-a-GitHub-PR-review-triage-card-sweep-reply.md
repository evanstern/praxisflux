---
id: TASK-0145
title: 'pdlc:pr-review-sweep — work a GitHub PR review: triage, card, sweep, reply'
status: Done
assignee: []
created_date: '2026-10-21 17:55'
updated_date: '2026-10-21 18:18'
labels:
  - pdlc
  - skill
dependencies: []
priority: medium
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New pdlc skill (v0.1.0 -> 0.2.0 after a skill-creator pass). Reads a PR review and its child comments, triages each (fix / pass / covered / defer / already resolved), cards fixes and deferrals as board tasks, runs pdlc:sweep over the fixes under host standing orders, then replies on the threads. Spec: specs/074-pdlc-pr-review-sweep. Evidence: dry runs against kofile/ai-coe-plugins PR #43 (open) and PR #44 (merged); trigger check 20/20.

Spec: specs/074-pdlc-pr-review-sweep
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 pdlc/skills/pr-review-sweep/SKILL.md present with Use-when description; registered in plugin.json, marketplace.json, pdlc README, planted template, root README
- [x] #2 test/pdlc.test.mjs pins its frontmatter and phase skeleton
- [x] #3 wiki notes for pdlc re-verified and re-pinned; check-docs and freshness gates green
- [ ] #4 one live (non-dry-run) use recorded, replies held for operator
- [x] #5 version bump per docs/releasing.md (0.68.0)
- [x] #6 Spec phase: Skill
- [x] #7 Spec phase: Registration and tests
- [x] #8 Spec phase: Grounding
- [x] #9 Spec phase: Live check
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
spec-bridge sync: Skill: 1/1 · Registration and tests: 2/2 · Grounding: 1/1 · Live check: 1/1 — status To Do → Done. AC #4 (live use) left unchecked: waived by operator 2026-10-21, first real use is the live test.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Skill: 1/1 · Registration and tests: 2/2 · Grounding: 1/1 · Live check: 1/1). Derived Done by spec-bridge sync. Live (non-dry-run) use of the skill was waived by the operator on 2026-10-21 and will happen on the next real PR review; any gap it finds becomes a follow-up task. Shipped in PR #157 (merge 198b27a5), released as v0.68.0.
<!-- SECTION:FINAL_SUMMARY:END -->
