---
id: TASK-93
title: >-
  wiki — backfill pdlc-sweep-history (0.48.0/0.50.0/0.51.0) via summary-style
  split; real sources for the test-suite-catalog hub
status: Done
assignee:
  - '@claude'
created_date: '2026-07-31 20:04'
updated_date: '2026-08-03 02:32'
labels:
  - debt
  - wiki
dependencies: []
priority: medium
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-18-47-56, finding 3 + minor item (f) (report: docs/reviews/team-review-praxis-2026-07-31-18-47-56.md; triage record: docs/reviews/refactor-triage-praxis-2026-07-31-18-47-56.md).

Evidence: docs/wiki/pdlc-sweep.md:92-97 promises '[[pdlc-sweep-history]] carries the per-release detail' for 0.48.0 (background-job mode), 0.50.0 (two-track reference), 0.51.0 (hand-authored-specs hatch + gate-softening rule) — the history note's last entry is 0.47.0, so the merge made the claim false. The note sits at 7,991/8,000 body chars: backfill forces a summary-style split (docs/corpus-spec.md; TASK-78's fresh pattern). TASK-90's log row classified the note 'reviewed-no-amend' while its source gained a 25-line doctrine section. Also: docs/wiki/test-suite-catalog-plugins.md has sources: [] — the freshness gate's one warn, staleness unverifiable.

Spec: specs/049-wiki-sweep-history-backfill
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 history note carries 0.48.0/0.50.0/0.51.0 entries with field evidence, via a split keeping every body ≤8,000 and capsules ≤500
- [x] #2 reciprocal wikilinks resolve; INDEX.md + CAPSULES.md regenerated verbatim
- [x] #3 test-suite-catalog-plugins hub note pins real sources (its children or test/) or is explicitly marked index-kind
- [x] #4 freshness gate green with zero warns; wiki-only, no version bump
- [x] #5 Spec phase: Phase 1 — Split design and measurement
- [x] #6 Spec phase: Phase 2 — Perform the split
- [x] #7 Spec phase: Phase 3 — Backfill 0.48.0 / 0.50.0 / 0.51.0
- [x] #8 Spec phase: Phase 4 — Hub note sources, regeneration, and the zero-warn gate
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep dispatch (runbook: docs/design/gates-and-doctrine-sweep-runbook.md, Lane 1). Tier: mechanical. Model ID: claude-sonnet-5, pinned via .claude/agents/sonnet-implementer.md frontmatter (NOT the dispatch-call model param — silently ignored by this harness, 2026-07-31). Fallback: claude-opus-4-8. Rubric justification: corpus hygiene to an existing pattern (TASK-78's summary-style split is the in-repo precedent), acceptance mechanically checkable by the freshness gate, no design choice. Served model: recorded per phase below.

CORRECTION (Phase 3, 2026-08-02, verified independently by the orchestrator): AC #1's '0.48.0' is the WRONG release. The background-job / no-main-push execution mode shipped in 0.49.0, not 0.48.0. Evidence: TASK-90 (3124b74c) introduced the doctrine and first targeted 0.48.0, but lost that number to sibling PR TASK-80 (bd5ce8f, unrelated refactor-triage content) which merged first; TASK-90 restamped to 0.49.0 before its own merge (da3e615). Verified: 'git show da3e615:.claude-plugin/marketplace.json' -> 0.49.0; 'git show bd5ce8f:...' -> 0.48.0; 'git log -S' confirms 3124b74c introduced the background-job section. docs/design/board-cost-test-runbook.md already recorded v0.49.0 correctly. READ AC #1 AS 0.49.0/0.50.0/0.51.0 — the backfilled entry is written under 0.49.0. The AC text is left unedited so the spec-bridge phase-AC mirroring is not disturbed; this note is the authoritative record. Consequence: docs/wiki/pdlc-sweep.md:98 carries the same wrong label and is fixed in Phase 4 as a recorded scope decision (see specs/049-wiki-sweep-history-backfill/spec.md R2).

AC #2 note: CAPSULES.md was regenerated via grounding-wiki/scripts/capsules.mjs (the only writer script alongside repin.mjs); INDEX.md has NO generator — verified, grounding-wiki/scripts/ holds only capsules.mjs and repin.mjs — so it is hand-maintained per the wiki-update skill. 'Regenerated verbatim' is satisfied for the file that has a generator.

spec-bridge sync: Phase 1 — Split design and measurement: 5/5 · Phase 2 — Perform the split: 5/5 · Phase 3 — Backfill 0.48.0 / 0.50.0 / 0.51.0: 6/6 · Phase 4 — Hub note sources, regeneration, and the zero-warn gate: 8/8 — status In Progress → Done
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Phase 1 — Split design and measurement: 5/5 · Phase 2 — Perform the split: 5/5 · Phase 3 — Backfill 0.48.0 / 0.50.0 / 0.51.0: 6/6 · Phase 4 — Hub note sources, regeneration, and the zero-warn gate: 8/8). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
