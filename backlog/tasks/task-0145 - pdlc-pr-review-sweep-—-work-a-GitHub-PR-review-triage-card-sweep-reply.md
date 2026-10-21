---
id: TASK-0145
title: 'pdlc:pr-review-sweep — work a GitHub PR review: triage, card, sweep, reply'
status: To Do
assignee: []
created_date: '2026-10-21 17:55'
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
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pdlc/skills/pr-review-sweep/SKILL.md present with Use-when description; registered in plugin.json, marketplace.json, pdlc README, planted template, root README
- [ ] #2 test/pdlc.test.mjs pins its frontmatter and phase skeleton
- [ ] #3 wiki notes for pdlc re-verified and re-pinned; check-docs and freshness gates green
- [ ] #4 one live (non-dry-run) use recorded, replies held for operator
- [ ] #5 version bump per docs/releasing.md (0.68.0)
<!-- AC:END -->
