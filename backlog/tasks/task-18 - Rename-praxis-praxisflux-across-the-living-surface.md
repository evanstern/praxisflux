---
id: TASK-18
title: Rename praxis -> praxisflux across the living surface
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 22:01'
updated_date: '2026-07-10 22:04'
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
- [x] #1 Marketplace id, README install lines, and all living docs/prose say praxisflux; check-docs green
- [x] #2 Stamped-region markers renamed consistently: canonical sources, consumers, SYNCS table, planted skill references; sync-shared --check green
- [x] #3 npm bin renamed praxisflux-gates; build-npm/action/package repository URL point at praxisflux; build-npm integration test green
- [x] #4 Touched skills' SKILL.md versions bumped; marketplace bumped to 0.6.0; bump gate green
- [x] #5 Wiki notes updated + re-pinned; freshness gate and full suite green
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Single perl sweep (praxis(?!flux) guard) over 67 living files; all couplings held in one pass (markers+SYNCS, marketplace id+README, fixtures). Skills bumped: wiki-build/research-vault/vault-artifact 0.1.1, codebase-to-course 0.1.2. Marketplace 0.6.0 stamped everywhere incl. action.yml pin. 15 wiki notes re-pinned against ada5f4c. Full suite 95 pass, every check mode green locally.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Renamed praxis -> praxisflux across all 67 living tracked files in one guarded perl pass (praxis(?!flux), both case variants): marketplace id (installs now <plugin>@praxisflux), README/CLAUDE.md/docs/wiki branding, code comments, tests, stamped-region markers (canonical + consumers + SYNCS together), npm bin (praxisflux-gates), uses: slugs and package.json repository URL (evanstern/praxisflux). Historical records (backlog/, docs/handoffs/, docs/course/) deliberately untouched. Touched skills bumped (3x 0.1.1, codebase-to-course 0.1.2); marketplace 0.6.0 stamped everywhere including the action.yml npx pin, so the next release publishes @praxisflux/gates@0.6.0 under the new branding. 15 wiki notes re-verified and re-pinned against the sweep commit ada5f4c. Verified: full suite 95 pass; gen-marketplace, sync-version, sync-shared, check-docs, wiki-freshness, and bump gate all green. PR #26. Post-merge user steps: rename the GitHub repo to praxisflux, configure the npm trusted publisher (evanstern/praxisflux + release.yml), delete NPM_TOKEN.
<!-- SECTION:FINAL_SUMMARY:END -->
