---
id: TASK-78
title: >-
  wiki budget headroom: split test-suite-catalog-plugins, trim the 499/500
  capsule, close the gate-invisible source coupling
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 16:26'
updated_date: '2026-07-31 17:50'
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
- [ ] #1 test-suite-catalog-plugins split summary-style with comfortable headroom; freshness green
- [ ] #2 pdlc-refactor-triage description trimmed below ~480 chars; CAPSULES regenerated
- [ ] #3 the note's sweep cross-claims are gate-visible (source added) or de-specified to the wikilink
- [x] #4 Spec phase: Spec
- [ ] #5 Spec phase: Implement
- [ ] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier sonnet, pinned claude-sonnet-5 via .claude/agents/sonnet-implementer.md agent definition (operator-approved at runbook sign-off, PR #108). Justification: mechanical corpus hygiene per docs/corpus-spec.md — split, trim, source fix; pattern exists, judgment small. Grouping call: single dispatch covers Implement+Prove.
<!-- SECTION:NOTES:END -->
