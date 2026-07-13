---
id: TASK-25
title: 'The presentation: praxisflux''s flow, demoable with WOW'
status: Done
assignee: []
created_date: '2026-07-12 01:23'
updated_date: '2026-07-13 20:15'
labels: []
dependencies: []
priority: high
ordinal: 500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The original goal of the whole endeavor (decision-1): present this flow as a way to ensure self-documentation and human-in-the-middle spec-driven development. User direction: the deliverable MUST be demoable, and the format deserves real thought — NOT just a live run or a narrated screen recording of a personal terminal setup; balance demoable against WOW. Format exploration is part of the task (candidates to weigh: an interactive single-page experience on the course chrome telling the whole arc; a canned-but-live demo harness with big readable output driving the actual pipeline against the tamagotchi; a hybrid deck+demo). Raw material all exists: decision-1, docs/orchestration/run-log.md + findings.md, docs/headless-runner.md, the six per-task courses, and a live pipeline. The tamagotchi arc (empty dir -> done in 3 runs, ~$4.54, three human approvals) is the natural demo spine.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Format decision recorded after exploring at least two concrete candidates (sketches/mockups, not just prose)
- [ ] #2 The artifact is built, self-contained, and presentable by the user without their personal terminal setup
- [ ] #3 A rehearsable demo path exists with a fallback (canned run or recording) if live infrastructure misbehaves
- [ ] #4 The narrative covers: files-as-truth + gates, the three tiers, the corrective loop, the human seam, and the tamagotchi arc
<!-- AC:END -->
