---
id: TASK-34
title: >-
  P3 + phase-status gates: artifact-gated seams as a praxis principle;
  spec-bridge speaks phase-level status
status: Done
assignee:
  - '@claude'
created_date: '2026-07-18 02:37'
updated_date: '2026-07-26 15:04'
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

Spec: specs/009-p3-phase-status-gates
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/principles.md gains P3 (artifact-gated seams: stages re-derive state from artifacts; trigger payloads are untrusted hints), following P1/P2's canonical-statement + reference-and-apply structure
- [x] #2 spec-bridge derivation supports an opt-in phase-level status vocabulary derived from spec artifacts, backward compatible with 3-status boards
- [x] #3 The bridge gate (status-never-exceeds-artifacts) enforces at phase granularity when the finer vocabulary is opted into
- [x] #4 Consumer-facing docs (consuming-gates.md and/or spec-bridge README) document the phase-status contract and the opt-in
- [x] #5 Cross-reference recorded: Coda's workflow-split epic names this task as its upstream blocker
- [x] #6 Spec phase: Spec
- [x] #7 Spec phase: Implement
- [x] #8 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 009-p3-phase-status-gates (hand-authored)
2. spec-bridge:link
3. Dispatch (session tier): P3 artifact-gated seams into docs/principles.md (canonical + reference-and-apply); spec-bridge derivation gains opt-in phase-level status vocabulary derived from spec artifacts; bridge gate enforces exceeds at phase granularity; 3-status boards unchanged; consumer docs; Coda cross-ref note
4. Tests; versions; wiki re-pins; PR; serial merge vs TASK-43
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 2 (docs/design/board-clearing-runbook.md). Tier: session-tier (canonical principle prose + gate design; biggest slice, HIGH, Coda-blocking). Backward-compat checkpoint armed: any design where a 3-status board changes behavior stops the lane.

Implemented: P3 (artifact-gated seams — doorbell/untrusted-hint framing, re-runnable/replaceable/orchestrator-agnostic payoff, P1 cross-ref, provenance line). spec-derive names the finer stage ladder (specifying/planning/implementing/validating/reviewing) with status = coarseStatus(stage), so 3-status parity holds by construction; opt-in via statusVocabulary in .spec-bridge.json; checkBridge/planBridge enforce at phase grain under the opt-in. 17 new tests incl. byte-identical config-absent parity; 24 pre-existing spec-bridge tests pass unmodified (186 total). Docs: spec-bridge README (canonical contract) + consuming-gates pointer + sync SKILL step; sync 0.2.0, marketplace 0.18.0. spec-bridge-plugin + gates-consumption-surface re-verified; CAPSULES regenerated. CROSS-REF (AC #5): Coda's workflow-split epic (kofile/coda) names this task as its upstream blocker — its per-phase board-status task depends on this landing; discoverable from here per the reference-and-apply contract.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both legs shipped. P3 (artifact-gated seams) is canonical in docs/principles.md: single-responsibility stages, every boundary re-derives state from durable artifacts, the trigger is a doorbell never a contract — payoff independently re-runnable / replaceable / orchestrator-agnostic stages; provenance recorded (colleague n8n SDLC design, Coda evaluation, same bet as decision-1 / Coda Principle IV). spec-bridge now derives a finer lifecycle stage ladder under the 3-status collapse (parity by construction), with an opt-in statusVocabulary in .spec-bridge.json mapping stages to consumer board statuses; the bridge gate enforces status-never-exceeds-artifacts at phase grain when opted in. 186 tests (24 pre-existing spec-bridge tests unmodified; config-absent behavior proven byte-identical). sync 0.2.0, marketplace 0.18.0. Coda's workflow-split epic is unblocked (cross-ref in notes).
<!-- SECTION:FINAL_SUMMARY:END -->
