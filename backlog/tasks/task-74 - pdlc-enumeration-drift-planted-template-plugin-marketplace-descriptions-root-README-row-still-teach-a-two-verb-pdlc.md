---
id: TASK-74
title: >-
  pdlc enumeration drift: planted template, plugin/marketplace descriptions,
  root README row still teach a two-verb pdlc
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 16:25'
updated_date: '2026-07-31 17:13'
labels:
  - debt
dependencies: []
priority: medium
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-27-16-07-29 — triage record docs/reviews/refactor-triage-praxis-2026-07-27-16-07-29.md (finding group A; report §improved 1 and the stale-row half of 6), evaluation report docs/reviews/team-review-praxis-2026-07-27-16-07-29.md.

The 0.40.0 release added pdlc's third skill but every enumerating surface outside the PR's diff still teaches a two-verb pdlc. Evidence: pdlc/templates/CLAUDE.md:32 (the grounding bootstrap PLANTS — every project bootstrapped at 0.40.0 inherits the mis-enumeration; highest blast radius); pdlc/.claude-plugin/plugin.json:4 and the mirrored .claude-plugin/marketplace.json pdlc description (install surface now disagrees with pdlc/README.md 'Three skills'); README.md:29 pdlc role cell (bootstrap only — sweep already missing, pre-existing); CLAUDE.md:127 (this repo's own planted block, header still v0.36.0 — never re-planted); docs/wiki/overview.md:39 ('pdlc sits before the loop' — now doubly wrong; freshness-green only because its pinned sources are the stale files).

Fix in one pass: amend template + descriptions + root README row; re-run pdlc:bootstrap here to re-plant CLAUDE.md; let the freshness gate pull overview.md through the wiki-update loop. Released surface (pdlc/, marketplace) → version bump per docs/releasing.md.

Spec: specs/041-pdlc-enumeration-drift
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 pdlc/templates/CLAUDE.md pdlc bullet names all three verbs incl. refactor-triage
- [x] #2 plugin.json + marketplace.json pdlc descriptions name the third skill (and keywords gain triage/debt)
- [x] #3 root README pdlc role cell consistent with what the plugin ships (style decision recorded)
- [x] #4 this repo's CLAUDE.md re-planted at current version; overview.md re-verified through wiki-update
- [x] #5 version bumps per docs/releasing.md; gates green
- [x] #6 Spec phase: Spec
- [x] #7 Spec phase: Implement
- [x] #8 Spec phase: Prove
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 dispatch (board-cost-test sweep): tier default-implementer, pinned claude-opus-5, fallback claude-opus-4-8 per operator ruling 2026-07-31 (Agent param opus; subscription resolves — record actual). Justification: multi-surface consistency edit incl. CLAUDE.md re-plant and wiki re-verification. Grouping call: single dispatch covers Implement+Prove (small interlocked phases; TASK-84 precedent); second fresh dispatch only if the first ends heavy.

2026-07-31 impl (dispatch): R1-R5 landed in 3f9c5f7 (surfaces+version 0.45.0+re-plant) and 815defa (wiki re-ground). All enumerating surfaces now teach three-verb pdlc (bootstrap/sweep/refactor-triage). Re-plant carried no hand edits (diff was version header + pdlc bullet only). overview.md prose amended+re-pinned; 11 sibling notes re-pinned (RE-PIN-ONLY); reorient/team-review quote unchanged skill versions. Gates green: node --test 252/0, check-docs, freshness 34 fresh, version-bump 0.44->0.45. AC #1-5,7,8 checked; T009/status left for orchestrator sync.
<!-- SECTION:NOTES:END -->
