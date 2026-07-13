---
id: TASK-29
title: >-
  Build plugin for real: the implementation leg, unified with the pipeline's
  agent node
status: Done
assignee: []
created_date: '2026-07-12 01:24'
updated_date: '2026-07-13 20:19'
labels: []
dependencies: []
priority: medium
ordinal: 125
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The research -> teach -> build loop's build leg is still a scaffold — and the pipeline just demonstrated its job three times (implement a SPEC, verify, return findings). Flesh out the build plugin so ONE implementation story serves both consumers: (a) the educate -> build handoff (request carrying a SPEC; response carrying findings; evidence handoff.specd/returned/foldedIn per docs/handoff-protocol.md), and (b) the pipeline's agent node (the skill claude -p runs against a checked-out target). Design question owned by this task: the build skill's SKILL.md shape must satisfy the headless-readiness checklist (docs/headless-runner.md) so orchestrated and interactive invocations are the same skill. The tamagotchi runs are the reference behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 build's implement skill executes a SPEC handoff end-to-end on a fixture educate project: consumes the request, implements, verifies by running the artifact, returns a findings response over the handoff transport
- [ ] #2 The same skill passes the headless-readiness checklist and runs to completion via claude -p in a fixture (gate/artifact-verified, not transcript-verified)
- [ ] #3 Evidence flow proven: handoff.specd -> returned -> foldedIn gates behave per the protocol on the fixture
- [ ] #4 Plugin README + wiki note updated; skill versioned; marketplace bumped
<!-- AC:END -->
