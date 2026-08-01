---
id: TASK-96
title: >-
  grounding — re-plant root CLAUDE.md block; collapse the no-main-push
  degradation clause to one home
status: To Do
assignee: []
created_date: '2026-07-31 20:04'
updated_date: '2026-08-01 14:23'
labels:
  - debt
  - grounding
dependencies:
  - TASK-98
priority: medium
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-18-47-56, findings 7+8 (report: docs/reviews/team-review-praxis-2026-07-31-18-47-56.md; triage record: docs/reviews/refactor-triage-praxis-2026-07-31-18-47-56.md).

Evidence: (8) root CLAUDE.md:96 block is pinned v0.45.0 and lacks the two-track landing bullet the template gained at 0.50.0 (pdlc/templates/CLAUDE.md:82-88) — a declared 046 non-goal, but the repo now operates under a rule its own always-on grounding doesn't state. (7) the no-main-push degradation clause lives in three places: the mode bullets (pdlc/skills/sweep/SKILL.md:352-358), the composition sentence with its parenthetical restatement of the two-track rule (:360-363), and the planted block (template :85-87) — an addition commit a7b544f admits was unrequested and spec 046 R4 warned against duplicating; the block is version-planted into N hosts, so the next mode change strands stale prose in every un-replanted one.

Ordered after TASK-98 (the mode text it dedupes must settle first). Re-plant caution: this repo's block may carry deliberate hand edits — diff against the old template render and relocate them, never clobber (standing operator convention). (Renumbered 2026-08-01: the card originally carded as TASK-92 by this triage run became TASK-98 after that number was taken on main.)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 root CLAUDE.md block re-planted to the current template render, hand edits relocated not clobbered
- [ ] #2 degradation clause collapsed to one normative home (mode bullets); SKILL composition sentence becomes a pure cross-reference (parenthetical gloss dropped); planted block's copy reduced to a pointer or kept as the single home — one home total, recorded choice
- [ ] #3 bootstrap/sweep skill version bumps as touched + lockstep
<!-- AC:END -->
