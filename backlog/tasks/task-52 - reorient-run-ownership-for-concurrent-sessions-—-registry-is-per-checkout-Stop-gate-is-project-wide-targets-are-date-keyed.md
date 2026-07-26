---
id: TASK-52
title: >-
  reorient: run ownership for concurrent sessions — registry is per-checkout,
  Stop gate is project-wide, targets are date-keyed
status: To Do
assignee: []
created_date: '2026-07-26 16:31'
labels:
  - reorient
  - design
dependencies: []
priority: medium
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Observed live in promptworld 2026-07-26 (see promptworld TASK-148 for the incident): two same-day reorient runs collided while unrelated sessions worked the repo. Three defects in the reorient plugin's run model: (1) .handoff/reorient/runs/ is per-checkout shared mutable state and gates/gate.sh fires on EVERY session stop for ANY in-flight run — sessions that don't own the run get nagged forever and cannot distinguish mine/theirs/orphaned (an operator abandoned a live run believing it orphaned; the owning session re-began it minutes later). (2) The synthesis target is date-keyed (docs/design/reorient-YYYY-MM-DD-<slug>.md) so two same-day runs collide on one output path — key it by run id instead. (3) No claim/liveness primitive: run manifests carry no owner (session id), no heartbeat, no origin-visible claim artifact, so liveness is guesswork; compare spec-claim-before-work (pushed artifact + push-rejection mutex). Design directions: owner+heartbeat on the manifest with the Stop gate scoped to the owning session; run-id-keyed synthesis targets; begin/abandon/takeover semantics that print who began the run, from where, and when. Interim operator doctrine until fixed: begin reorient runs from inside a worktree — .handoff/ is gitignored and therefore checkout-local, so the registry and its gate stay lane-local and never nag other sessions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Run manifests carry ownership (session identity) and the Stop gate nags only the owning session/checkout
- [ ] #2 Synthesis target paths are unique per run (run-id-keyed), never date-keyed
- [ ] #3 begin/list/abandon surface owner + provenance so orphan-vs-live is decidable; takeover is explicit
<!-- AC:END -->
