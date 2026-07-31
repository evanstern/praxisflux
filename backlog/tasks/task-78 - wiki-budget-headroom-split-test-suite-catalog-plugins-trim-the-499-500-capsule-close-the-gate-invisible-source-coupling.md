---
id: TASK-78
title: >-
  wiki budget headroom: split test-suite-catalog-plugins, trim the 499/500
  capsule, close the gate-invisible source coupling
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 16:26'
updated_date: '2026-07-31 18:02'
labels:
  - debt
dependencies: []
priority: low
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-27-16-07-29 — triage record docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md (group E; report §improved 8), evaluation report docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

Evidence: docs/wiki/test-suite-catalog-plugins.md body at 7695/8000 chars and growing by appending — the next honest amendment collides with the size gate, incentivizing shave-a-word fixes; docs/wiki/pdlc-refactor-triage.md description at 499/500 chars (one adjective from breaking the capsules gate); the same note's Handing-off prose asserts sweep specifics ('skill 0.9.0 names refactor-triage…') grounded in pdlc/skills/sweep/SKILL.md, which is NOT in its sources: — prose that can rot with the freshness gate green.

Fix: summary-style split of the catalog (per docs/corpus-spec.md), trim the description proactively, and either add sweep's SKILL.md to the note's sources or lean on the [[pdlc-sweep]] link instead of restating specifics. Wiki-only → no version bump; CAPSULES regenerated with any description change.

Spec: specs/044-wiki-budget-headroom
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 test-suite-catalog-plugins split summary-style with comfortable headroom; freshness green
- [x] #2 pdlc-refactor-triage description trimmed below ~480 chars; CAPSULES regenerated
- [x] #3 the note's sweep cross-claims are gate-visible (source added) or de-specified to the wikilink
- [x] #4 Spec phase: Spec
- [x] #5 Spec phase: Implement
- [x] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier sonnet, pinned claude-sonnet-5 via .claude/agents/sonnet-implementer.md agent definition (operator-approved at runbook sign-off, PR #108). Justification: mechanical corpus hygiene per docs/corpus-spec.md — split, trim, source fix; pattern exists, judgment small. Grouping call: single dispatch covers Implement+Prove.

Implemented R1-R3. R1: test-suite-catalog-plugins (7629-char body) split summary-style into test-suite-catalog-plugins-gates (9 single-plugin output-gate bullets, 5744 chars) and test-suite-catalog-plugins-pipeline (7 content-pipeline/handoff bullets, 2688 chars); parent is now a 1317-char pointer note (sources: [] — no per-file claims, matches test-suite's precedent); INDEX.md updated with both children. R2: pdlc-refactor-triage description trimmed 487 -> 441 chars, four-entry-modes accuracy kept; CAPSULES.md regenerated. R3: de-specified the Handing-off prose to lean on [[pdlc-sweep]] instead of restating sweep-version specifics not in sources (preferred approach per spec). All notes re-pinned to 253e0a979a77df83ef234ddc2bfb89e175da6ef6. Gates green: node --test 252/252, check-docs clean, freshness OK (36 notes; one WARN on the new pointer note's empty sources, not a fail). No version bump (wiki-only). Commits: 253e0a9 (content), 0e41d47 (re-pins + capsules).

spec-bridge sync: Spec: 2/2 · Implement: 3/3 · Prove: 3/3 — status In Progress → Done (PR #114, merge 6adfbb8)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All spec tasks complete (Spec: 2/2 · Implement: 3/3 · Prove: 3/3). Derived Done by spec-bridge sync.
<!-- SECTION:FINAL_SUMMARY:END -->
