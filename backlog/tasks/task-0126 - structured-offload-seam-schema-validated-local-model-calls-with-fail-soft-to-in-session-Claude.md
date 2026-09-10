---
id: TASK-0126
title: >-
  structured-offload seam: schema-validated local-model calls with fail-soft to
  in-session Claude
status: Done
assignee:
  - '@claude'
created_date: '2026-09-10 14:29'
updated_date: '2026-09-10 17:01'
labels:
  - chassis
  - feature
  - sweep-cost
dependencies: []
ordinal: 157000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A chassis helper for routing narrow, mechanically-checkable work to a local model (Ollama / LM Studio on mbpro-m1.local, or any OpenAI-compatible endpoint) instead of spending orchestrator context on it.

The selection rule this seam exists to enforce: offload work whose output is checkable WITHOUT trusting the model. Not 'work that reads a lot'. That distinction is what keeps the grounding invariant intact — a free-text summary is unverifiable and, behind a verified_against pin, becomes corpus rot the freshness gate cannot detect (see TASK-0124 for the same hazard from the shunt read). A schema-validated response whose every claim carries a checkable referent (a path that must stat, a label that must be in the pick-list, an enum) fails loudly instead of quietly.

Scope is the SEAM ONLY — no consumers land here. Signature is roughly (prompt, schema, endpoint) -> validated object. Requirements:

- Constrained decoding where the backend offers it (Ollama format / LM Studio JSON schema), so the model is structurally prevented from returning prose.
- Validate the response against the caller's schema; a failure is not an error the caller handles, it is a FALLBACK.
- Fail-soft is the whole design: validation failure, timeout, connection refused, or endpoint unset all degrade to the caller doing the work in-session. A local model that is down or wrong must never block a sweep. Absent config = current behavior, exactly.
- Endpoint and model configured as data (alongside .claude/model-tiers.json, which is the existing 'model routing lives in config, not code' precedent), not hardcoded to one host.
- Emit enough per-call residue (backend used, validated vs fell back) that the follow-on consumer can be MEASURED rather than assumed. A seam nobody can measure cannot justify its second consumer.

Explicitly out of scope, permanently: anything whose output IS judgment — design-rounds grounding, note bodies, spec authoring, merge and gate decisions. Not a capability limit; the artifact's value is that a reasoning agent stands behind it.

Spec: specs/063-structured-offload-seam
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A chassis helper takes prompt plus JSON schema plus endpoint config and returns a validated object
- [x] #2 Constrained/structured decoding is requested from the backend where supported, rather than relying on prompt instructions alone
- [x] #3 Validation failure, timeout, or unreachable endpoint falls back to in-session handling — never an error surfaced to the user and never a blocked sweep
- [x] #4 With no endpoint configured the behavior is byte-identical to today (opt-in, absent by default)
- [x] #5 Endpoint and model are configuration data, not hardcoded, and the config surface is documented next to the model-tier ladder
- [x] #6 Each call leaves residue recording backend used and whether the result validated or fell back, so a consumer can be measured
- [x] #7 Tests cover the fallback paths (invalid JSON, schema mismatch, timeout, refused connection) with no live model required
- [x] #8 Spec phase: Phase 1 — The module and its tests
- [x] #9 Spec phase: Phase 2 — Documentation, versions, wiki
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
claimed by sweep (sweep-cost-offload-runbook) 2026-09-10; tier sonnet, model cc/claude-sonnet-5[1m] — work to a written card, fallback semantics and scope already settled; served model recorded at dispatch

spec-bridge sync: Phase 1 — The module and its tests: 6/6 · Phase 2 — Documentation, versions, wiki: 6/6 — status In Progress → Done

ACs 1-7 verified against merged PR #141: offload() signature + constrained decoding (ollama format / openai json_schema) + all fallback paths tested against stubs + opt-in absent-by-default + config beside tier ladder documented in docs/wiki/chassis.md + per-call residue
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Phase 1 — The module and its tests: 6/6 · Phase 2 — Documentation, versions, wiki: 6/6). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
