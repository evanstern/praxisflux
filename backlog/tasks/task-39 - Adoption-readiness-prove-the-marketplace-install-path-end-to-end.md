---
id: TASK-39
title: 'Adoption readiness: prove the marketplace install path end-to-end'
status: Done
assignee:
  - '@claude'
created_date: '2026-07-23 17:25'
updated_date: '2026-07-23 18:12'
labels: []
dependencies: []
references:
  - >-
    backlog/docs/reviews/doc-1 -
    Team-review-2026-07-23-—-praxisflux-vs-its-own-tenets.md
priority: high
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Owner decision (2026-07-23, team-review follow-up): praxisflux is intended for consumption by others — opinionated about its own internal tool choices, opt-in for third-party stuff, but the consumption surface must actually work. The team review found the biggest structural bet unverified: the symlinked-lib scheme rests on marketplace installs dereferencing lib -> ../lib, and no CI job simulates that path; the four Stop shims are bash and repo symlinks assume core.symlinks, so Windows users would get gates that are silently absent. Convert the bet into a checked invariant.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A CI job simulates a marketplace install (copies a plugin with symlinks dereferenced) and spawns its gate.sh/stop.mjs with fake stdin against a fixture, asserting exit codes — covering both the symlink bet and the currently-untested hook path
- [x] #2 README Install section accurately states the supported install surfaces and their access prerequisites (including the private-repo caveat until the repo goes public)
- [x] #3 Windows support is an explicit recorded decision (supported, or declared out of scope in README/docs), not silence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-39-install-path off main
2. AC1 — test/install-path.test.mjs: for every marketplace plugin that ships hooks/hooks.json, simulate a marketplace install into a temp dir (copy the plugin, dereference lib -> ../lib into a real directory, assert no symlink remains), then spawn the EXACT Stop command from hooks.json (CLAUDE_PLUGIN_ROOT substituted) via bash with fake stdin JSON: (a) clean fixture -> exit 0 (proves the dereferenced import chain loads), (b) per-plugin tripping fixture (educate topics/, research .research-vault + CDN html, spec-bridge Done-task-vs-unproven-spec, team-review in-flight run) -> exit 2 with the gate's message on stderr, (c) same tripping fixture with stop_hook_active:true -> exit 0 (loop guard through the real spawn path). Add a dedicated ci.yml job install-path running this file.
3. AC2 — rewrite README Install to enumerate the actual surfaces (marketplace add from GitHub or local clone, per-plugin release zips, composite GitHub Action, npx @praxisflux/gates) with access prerequisites. Verified 2026-07-23: repo is PUBLIC and @praxisflux/gates@0.10.0 is live on npm, so the private-repo caveat the AC anticipated is replaced by an accurate public statement.
4. AC3 — record Windows as explicitly out of scope (bash Stop shims + symlink packaging; WSL works) in a Platform-support note in README Install plus a backlog decision record.
5. Verify: node --test, check-docs, wiki freshness (wiki-update pass if it trips), per-task course docs/courses/TASK-39, finalize, PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1 shipped: test/install-path.test.mjs (5 tests) + ci.yml install-path job. Coverage is derived from marketplace.json + hooks/hooks.json presence — a future hook plugin without a tripping fixture fails the completeness test loudly. Verified the test has teeth: a copy WITHOUT the lib dereference exits 1 (ERR_MODULE_NOT_FOUND) and trips the exit-0 assertion. Full suite 147/147.

AC2+AC3: README Install rewritten around the three real surfaces (marketplace, release zips, action/npx gates) with prerequisites. Reality check 2026-07-23: repo visibility PUBLIC (gh api private=false), @praxisflux/gates@0.10.0 live on npm — the private-repo caveat the AC anticipated was already stale; replaced with the accurate 'every surface is public'. Windows: declared out of scope in README ### Platform support (bash shims + core.symlinks rationale, WSL escape hatch, revisit bar = tested PowerShell shim path). Decision recorded in README/docs per the AC; no backlog decision file since the CLI can't write decision content and hand-editing backlog markdown is forbidden.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Converted the symlinked-lib install bet into a checked invariant, made the README's install claims match verified reality, and recorded the Windows decision. (1) test/install-path.test.mjs: for every marketplace plugin shipping hooks/hooks.json (catalog-derived, currently educate/research/spec-bridge/team-review), simulates a marketplace install into a temp dir (copy + dereference lib->../lib, asserts zero surviving symlinks), then spawns the exact hooks.json Stop command via bash with fake hook JSON on stdin: clean fixture -> exit 0 (proves the dereferenced import chain), per-plugin violating fixture -> exit 2 with the gate's stderr message (proves the gate evaluates, not a vacuous pass), stop_hook_active -> exit 0 (loop guard through the real shim). Teeth verified by hand: a non-dereferenced copy exits 1 and fails the test. Dedicated ci.yml job install-path keeps the signal visible; the file also runs in node --test. (2) README Install rewritten around the three real surfaces (marketplace add, per-release plugin zips, action/npx gates-only) — verified 2026-07-23 that the repo is PUBLIC and @praxisflux/gates@0.10.0 is live on npm, so the stale private-repo caveat became 'every surface is public'. (3) Windows explicitly out of scope in README ### Platform support (bash shims + core.symlinks rationale, WSL escape hatch, revisit bar = tested PowerShell shim path). Wiki re-verified (build-and-release, test-suite, overview repinned); per-task course at docs/courses/TASK-39 (3 modules, course gate green). Verified: 147/147 tests (5 new install-path e2e), check-docs, wiki freshness, course gate all green.
<!-- SECTION:FINAL_SUMMARY:END -->
