---
id: TASK-17
title: >-
  Publish the gate surface as an npm package (@praxis/gates) — the documented
  upgrade path from the composite action
status: To Do
assignee: []
created_date: '2026-07-10 18:33'
labels: []
dependencies:
  - TASK-16
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The mature endpoint for consuming praxis gates outside GitHub Actions is an npm package. The composite action (TASK-16) is deliberately designed so this migration is invisible to consumers. THE UPGRADE PATH, so it is not forgotten:

1. SECURE THE NAME. Verify the @praxis npm scope is claimable (checked 2026-07-10: no @praxis/gates package exists, but the bare 'praxis' package name is taken since 2015 and scope/org ownership could not be confirmed anonymously). Fallbacks if the scope is taken: @evanstern/praxis-gates or praxis-gates.
2. CARVE THE PACKAGE. lib/ chassis + the gate CLIs (spec-bridge, grounding-wiki freshness, codebase-to-course course) into one zero-dependency package with a single bin ('praxis-gates <gate> [args]') wrapping the same runner the action uses. Version stays lockstep with the marketplace version (one release = one npm version).
3. WIRE PUBLISHING into release.yml next to the zip step: npm publish with provenance/trusted publishing (needs npm account linkage or NPM_TOKEN secret) — publish only when tag v<version> is new, same idempotence rule as the GitHub Release.
4. SWAP THE ACTION INTERNALS to 'npx @praxis/gates@<pinned>' instead of running from github.action_path. Consumers' 'uses: evanstern/praxis@v<tag>' line does not change — no consumer-visible break.
5. NEW CONSUMERS outside GitHub CI (other CI systems, local one-offs) get 'npx @praxis/gates <gate>' directly; document in the consuming-gates doc.
6. OPTIONAL LATER: the Claude Code marketplace spec supports npm plugin sources, so plugin distribution itself could eventually ride the same package — separate decision, do not bundle into this task.

Semver discipline for the CLI surface (flags, exit codes) is already enforced by the bump gate; publishing makes it a public commitment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Package name/scope secured and recorded (or fallback chosen and documented)
- [ ] #2 Zero-dep package carved with a praxis-gates bin wrapping the shared runner, version lockstep with the marketplace
- [ ] #3 release.yml publishes to npm exactly once per new v<version> tag, with provenance
- [ ] #4 Composite action switched to the package with zero consumer-visible change
- [ ] #5 consuming-gates doc + releasing.md updated to describe the npm surface
<!-- AC:END -->
