---
id: TASK-74
title: >-
  pdlc enumeration drift: planted template, plugin/marketplace descriptions,
  root README row still teach a two-verb pdlc
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 16:25'
updated_date: '2026-07-31 16:48'
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
- [ ] #1 pdlc/templates/CLAUDE.md pdlc bullet names all three verbs incl. refactor-triage
- [ ] #2 plugin.json + marketplace.json pdlc descriptions name the third skill (and keywords gain triage/debt)
- [ ] #3 root README pdlc role cell consistent with what the plugin ships (style decision recorded)
- [ ] #4 this repo's CLAUDE.md re-planted at current version; overview.md re-verified through wiki-update
- [ ] #5 version bumps per docs/releasing.md; gates green
<!-- AC:END -->
