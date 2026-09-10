---
id: TASK-0127
title: >-
  wiki-update freshness triage as the structured-offload seam's first (and only)
  consumer
status: Done
assignee:
  - '@claude'
created_date: '2026-09-10 14:29'
updated_date: '2026-09-10 19:26'
labels:
  - grounding-wiki
  - feature
  - sweep-cost
dependencies:
  - TASK-0126
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Land exactly one consumer of the TASK-0126 structured-offload seam and MEASURE it. One consumer is what tells us whether the seam earns a second; adding several at once means learning nothing from any of them.

wiki-update's triage is the right first consumer because the skill already splits on this exact axis — its plan loop classifies every stale or conflicted pin as a computed re-pin versus work that needs judgment — and because the classification is high-volume, mechanically shaped, and cheap to check.

Shape: given a note's sources: list and the diff touching them, return a per-note enum (computed-re-pin | needs-review) with the deciding file path. Both parts are verifiable without trusting the model — the enum is closed, the path must appear in the actual diff. A response failing either check falls back to in-session classification via the seam's fail-soft path.

The invariant this must not cross, and the reason the consumer is triage rather than re-pinning: the local model only ROUTES. It never writes a note body, never sets a verified_against pin, and never decides that a pin is still earned. Claude still reads the source for everything routed to needs-review. Offloading the routing narrows what Claude reads; offloading the verification would forge the pin — the precise failure carded in TASK-0124.

Deliberately conservative bias: misrouting a needs-review note to computed-re-pin is the expensive error (a false pin), while the reverse just costs a read Claude was going to do anyway. Prompt and schema should reflect that asymmetry, and the measurement should report it.

Measurement is a deliverable, not a nice-to-have: run a real wiki-update pass over the praxis corpus (43 notes) with the seam on and off, and record tokens, wall-clock, fallback rate, and misroute rate against Claude's own classification as ground truth. That result — not intuition — decides whether a second consumer gets built or the seam gets reverted.

Spec: specs/065-wiki-triage-offload
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 wiki-update's triage step routes classification through the structured-offload seam when configured, and behaves exactly as today when it is not
- [ ] #2 The response schema is a closed enum per note plus a deciding file path that must appear in the diff; anything else falls back
- [ ] #3 The local model never writes a note body, sets a pin, or decides a pin is earned — routing only, with source reads for needs-review notes unchanged
- [ ] #4 Prompt and schema encode the conservative bias: when uncertain, route to needs-review
- [ ] #5 A real wiki-update pass over the praxis corpus is measured seam-on vs seam-off, recording tokens, wall-clock, fallback rate, and misroute rate vs Claude-as-ground-truth
- [ ] #6 The measurement is written up with an explicit verdict on whether a second consumer is justified
- [ ] #7 check-docs, wiki-freshness, and spec-bridge gates green
- [x] #8 Spec phase: Phase 1 — The triage-offload script and its tests
- [ ] #9 Spec phase: Phase 2 — Skill wiring, versions, wiki
- [ ] #10 Spec phase: Phase 3 — The measurement (endpoint required)
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
claimed by sweep (sweep-cost-offload-runbook) 2026-09-10; tier sonnet, model cc/claude-sonnet-5[1m] — consumer wiring to the merged 0126 seam plus a measurement protocol the card specifies; served model recorded at dispatch; dep TASK-0126 Done
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Phase 1 — The triage-offload script and its tests: 4/4 · Phase 2 — Skill wiring, versions, wiki: 5/5 · Phase 3 — The measurement (endpoint required): 4/4). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
