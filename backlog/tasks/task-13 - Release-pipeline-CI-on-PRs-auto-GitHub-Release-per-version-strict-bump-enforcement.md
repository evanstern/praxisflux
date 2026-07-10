---
id: TASK-13
title: >-
  Release pipeline: CI on PRs, auto GitHub Release per version, strict bump
  enforcement
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-10 13:40'
updated_date: '2026-07-10 13:44'
labels: []
dependencies: []
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Automate build → version bump → GitHub Release, and make version bumps enforceable instead of honor-system.

Design (agreed direction):
- The marketplace version (.claude-plugin/marketplace.json .version) stays the single release version; sync-version.mjs already keeps every plugin.json in lockstep with it. Releases are git tags + GitHub Releases named v<version>.
- CI (GitHub Actions) on every PR: node --test, gen-marketplace --check, sync-version --check, build.mjs must succeed, plus a NEW check-version-bump script that compares the PR against its merge-base with main: if the diff touches released surface (any plugin dir, lib/, scripts/, .claude-plugin/), the marketplace version must be a semver INCREASE over main's, and tag v<new> must not already exist. Docs-only / backlog-only PRs are exempt and need no bump.
- Release workflow on push to main: read the marketplace version; if tag v<version> already exists, skip (idempotent — exempt merges release nothing). Otherwise run checks, node scripts/build.mjs, zip each dist/<plugin> as <plugin>-v<version>.zip, create the tag and a GitHub Release v<version> with generated notes and the zips attached. Combined with the PR check, every substantive merge produces exactly one release named after the marketplace version.
- Skill-level versions: SKILL.md frontmatter gains a version: field (skills spec supports it; currently none carry one). check-version-bump also enforces: a PR touching files under <plugin>/skills/<skill>/ must bump that skill's version. Chrome's CHROME_VERSION convention (TASK-11/12) is separate and stays as-is.
- Local mirror: .githooks/pre-push runs check-version-bump against origin/main (pre-commit already runs the consistency checks; core.hooksPath enabled 2026-07-10 — it had never been configured). CI remains authoritative since hooksPath is per-clone.
- Bump-size guidance documented in docs/releasing.md: patch = fixes/content tweaks, minor = new skill/plugin or behavior change, major = breaking convention/handoff changes. Recipe: node scripts/sync-version.mjs <new>.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 scripts/check-version-bump.mjs: given --base <ref>, fails when released-surface files changed without a semver-increasing marketplace version bump, exempts docs/backlog-only diffs, and rejects a version whose v-tag already exists; node --test covers pass/fail/exempt cases
- [ ] #2 Every SKILL.md carries version: frontmatter, and check-version-bump fails a diff that edits files under a skill dir without bumping that skill's version
- [ ] #3 .github/workflows/ci.yml runs tests, gen-marketplace --check, sync-version --check, build.mjs, and the bump check on every PR
- [ ] #4 .github/workflows/release.yml: on push to main with no existing v<version> tag, builds, zips each dist/<plugin>, and publishes a GitHub Release v<version> with the zips attached; a docs-only merge publishes nothing
- [ ] #5 docs/releasing.md documents the bump rules (patch/minor/major, skill-version rule, sync-version recipe) and CLAUDE.md links to it; .githooks/pre-push mirrors the bump check locally
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/check-version-bump.mjs — --base <ref> (default origin/main): diff merge-base..HEAD; if released surface touched (plugin src dirs from marketplace.json, lib/, scripts/, .claude-plugin/), require marketplace version semver-increase over base and no existing v<version> tag; exempt docs/, backlog/, test/, .github/, .githooks/, .claude/, root md files. Per changed <plugin>/skills/<skill>/ file, require that skill's SKILL.md version to increase (absent-at-base counts as bumped).
2. test/version-bump.test.mjs — build throwaway git repos in tmp; cover: exempt diff passes without bump, surface diff without bump fails, with bump passes, tag-reuse fails, skill edit without skill bump fails / with bump passes.
3. Stamp version: 0.1.0 into every SKILL.md frontmatter (12 skills across 6 plugins).
4. .github/workflows/ci.yml — PRs: node --test, gen-marketplace --check, sync-version --check, build.mjs, check-version-bump --base origin/<base_ref> (checkout fetch-depth 0).
5. .github/workflows/release.yml — push to main: skip if v<version> tag exists; else tests+checks, build.mjs, zip dist/<plugin> → <plugin>-v<version>.zip, gh release create v<version> --generate-notes with zips (permissions: contents write).
6. .githooks/pre-push — run check-version-bump against origin/main; docs/releasing.md with bump rules (patch/minor/major, skill rule, sync-version recipe); link from CLAUDE.md.
7. This PR itself touches released surface → bump to 0.2.0 via sync-version.mjs; merged, it publishes the first release v0.2.0 and proves the pipeline end-to-end.
<!-- SECTION:PLAN:END -->
