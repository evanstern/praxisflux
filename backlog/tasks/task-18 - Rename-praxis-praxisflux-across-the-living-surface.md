---
id: TASK-18
title: Rename praxis -> praxisflux across the living surface
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-10 22:01'
updated_date: '2026-07-10 22:02'
labels: []
dependencies: []
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The praxisflux npm org is secured and @praxisflux/gates@0.5.0 is live; the repo pivots to match (user renames the GitHub repo to praxisflux after this merges). Rename every LIVING reference: marketplace id (installs become <plugin>@praxisflux), README/CLAUDE.md/docs branding, wiki notes, code comments, tests, the praxis: stamped-region markers (canonical lib/html/base.html + lib/toolkit/tooltip.md, consumers, SYNCS table, tests, planted references), the npm bin (praxis-gates -> praxisflux-gates), action.yml uses: examples and package.json repository URL (evanstern/praxisflux — GitHub redirects the old slug after rename). EXCLUDED as historical record: backlog/ (tasks + decisions), docs/handoffs/, docs/course/, git history. Case variants: praxis and Praxis only. No external consumers exist yet (user-confirmed), so no migration/coordination needed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marketplace id, README install lines, and all living docs/prose say praxisflux; check-docs green
- [ ] #2 Stamped-region markers renamed consistently: canonical sources, consumers, SYNCS table, planted skill references; sync-shared --check green
- [ ] #3 npm bin renamed praxisflux-gates; build-npm/action/package repository URL point at praxisflux; build-npm integration test green
- [ ] #4 Touched skills' SKILL.md versions bumped; marketplace bumped to 0.6.0; bump gate green
- [ ] #5 Wiki notes updated + re-pinned; freshness gate and full suite green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-18-praxisflux-rename off main.
2. Mechanical sweep: perl -pi -e 's/praxis(?!flux)/praxisflux/g; s/Praxis(?!flux)/Praxisflux/g' over living files (exclude backlog/, docs/handoffs/, docs/course/, dist/, .git) — covers prose, markers, bin name, uses: slugs, repository URL in one consistent pass.
3. Repair the moving parts the sweep exposes: sync-shared re-stamp if needed, gen-marketplace regen, README install lines vs marketplace id (check-docs), test fixture expectations.
4. Bump touched skills' SKILL.md versions (wiki-build, research-vault, vault-artifact, codebase-to-course); sync-version 0.6.0 (stamps marketplace, plugin.jsons, action.yml npx pin).
5. Full suite + all check modes; wiki re-pin cadence per source-touching commit.
6. Finalize, PR. User renames the GitHub repo afterward (redirects keep old slugs working).
<!-- SECTION:PLAN:END -->
