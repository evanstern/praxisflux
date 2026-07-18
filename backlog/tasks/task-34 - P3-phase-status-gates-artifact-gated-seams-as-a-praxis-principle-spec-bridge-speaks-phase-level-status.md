---
id: TASK-34
title: >-
  P3 + phase-status gates: artifact-gated seams as a praxis principle;
  spec-bridge speaks phase-level status
status: To Do
assignee: []
created_date: '2026-07-18 02:37'
labels: []
dependencies: []
priority: high
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coda is evaluating a colleague-authored 9-workflow n8n SDLC design (WF1 grader → WF2 designer → WF3 planner → WF4 executor → WF5 validator → WF6/7 PR+reviewer/fixer → WF8 merger → WF9 deployer). Two of its ideas generalize past Coda and belong in the praxis chassis — this task is the upstream half; Coda's workflow-split epic will record this task as a blocker for its dependent work.

Leg 1 — principles.md gains P3 (artifact-gated seams). The colleague design chains stages by direct workflow calls that trust the caller's payload. The praxis-grade restatement: a pipeline SHOULD be split into single-responsibility stages, and every stage boundary MUST re-derive its state from durable artifacts (git, the board, spec dirs, run records) — the trigger is a doorbell, never a contract; a payload is an untrusted hint. This is P1 (artifact-grounded action) applied to orchestration seams, and it is the property that makes stages independently re-runnable, replaceable, and orchestrator-agnostic (same bet as praxis decision-1 / Coda constitution Principle IV). Follow P1/P2's reference-and-apply contract: canonical statement here, consumers reference and add domain application.

Leg 2 — praxisflux gate support for phase-level status. The colleague design's Jira flow (Design → Planning → In Progress → Validation → Ready for PR → Merge Check → Deploying → Done) makes the board the pipeline's observability surface. praxis boards collapse all of that into 'In Progress', and the spec-bridge gate only knows the 3-status vocabulary. Extend spec-bridge (derivation module + bridge gate, TASK-9.x lineage) so a consumer board MAY opt into a finer phase-status vocabulary derived from spec artifacts (spec.md exists → past Specifying; plan.md → past Planning; tasks.md ticked → Implementing/Validating; PR open → in review; merged → Done), with the bridge gate enforcing status-never-exceeds-artifacts at that granularity. Must stay backward compatible: 3-status boards keep working unchanged.

First consumer: Coda (kofile/coda) — its per-phase board-status task depends on this landing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/principles.md gains P3 (artifact-gated seams: stages re-derive state from artifacts; trigger payloads are untrusted hints), following P1/P2's canonical-statement + reference-and-apply structure
- [ ] #2 spec-bridge derivation supports an opt-in phase-level status vocabulary derived from spec artifacts, backward compatible with 3-status boards
- [ ] #3 The bridge gate (status-never-exceeds-artifacts) enforces at phase granularity when the finer vocabulary is opted into
- [ ] #4 Consumer-facing docs (consuming-gates.md and/or spec-bridge README) document the phase-status contract and the opt-in
- [ ] #5 Cross-reference recorded: Coda's workflow-split epic names this task as its upstream blocker
<!-- AC:END -->
