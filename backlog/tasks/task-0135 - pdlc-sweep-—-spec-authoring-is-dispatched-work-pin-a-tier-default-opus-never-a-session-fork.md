---
id: TASK-0135
title: >-
  pdlc:sweep — spec authoring is dispatched work: pin a tier (default opus),
  never a session fork
status: To Do
assignee: []
created_date: '2026-09-29 09:49'
labels:
  - pdlc
  - sweep
  - cost
dependencies: []
priority: high
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Field report from the-stacks M1 wave-1 sweep (2026-09-29; the-stacks docs/design/m1-wave1-sweep-runbook.md retrospective).

pdlc:sweep step 3 (Spec Kit cycle) does not say WHO authors the spec. Step 5 pins implementation to a tier, but spec authoring is unassigned, so the orchestrator ran it in context-inheriting session forks. Four specs cost ~1.6M tokens against ~3.8M for all sonnet implementation. A fork also leaves no Dispatch line, so the spend is invisible on the board and the spec-bridge dispatch-record gate cannot see it.

Operator ruling (the-stacks, 2026-09-29): spec authoring needs a high-reasoning model, and Opus is the right tier, but it must be a pinned dispatch with a lean prompt, not a fork.

Proposed: the runbook template names a spec-authoring tier per task (default: the config's escalation tier or a new specTier key in model-tiers.json). Step 3 dispatches <tier>-implementer with the card id, the spec dir, and the decision docs. The served model is verified and recorded as a Dispatch line, exactly as for implementation. The CLAUDE.md model-tiers doctrine states that spec authoring is dispatched work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pdlc:sweep step 3 dispatches spec authoring to a pinned tier agent and forbids session forks for it
- [ ] #2 The runbook template carries a per-task spec-authoring tier and model ID
- [ ] #3 model-tiers.json supports declaring the spec-authoring tier (new key or documented use of an existing tier), and tiers.mjs --check covers it
- [ ] #4 Spec-authoring dispatches produce a Dispatch line the spec-bridge dispatch-record gate recognizes
- [ ] #5 The planted CLAUDE.md model-tiers block states that spec authoring is dispatched, not done inline or by fork
<!-- AC:END -->
