---
id: TASK-17
title: >-
  Publish the gate surface as an npm package (@praxis/gates) — the documented
  upgrade path from the composite action
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-10 18:33'
updated_date: '2026-07-10 20:41'
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
- [x] #2 Zero-dep package carved with a praxis-gates bin wrapping the shared runner, version lockstep with the marketplace
- [x] #3 release.yml publishes to npm exactly once per new v<version> tag, with provenance
- [ ] #4 Composite action switched to the package with zero consumer-visible change
- [ ] #5 consuming-gates doc + releasing.md updated to describe the npm surface
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Secure name (AC#1): user decision — try @praxis org, fallback @evanstern/praxis-gates or bare praxis-gates (bare appears unclaimed as of 2026-07-10; @praxis/gates unpublished). Record outcome in notes + docs.
2. Carve (AC#2): scripts/build-npm.mjs assembles a staging tree (dist/npm/) mirroring repo layout with plugin lib symlinks dereferenced — scripts/run-gates.mjs (bin, shebang already present), lib/, {spec-bridge,grounding-wiki,codebase-to-course}/gates + their lib copies + codebase-to-course validate.mjs reference — and generates package.json (name, version from marketplace.json = lockstep, type:module, bin praxis-gates, zero deps). Integration test: build → npm pack → install tarball offline → run bin through node_modules/.bin symlink, assert contract exit codes (runAsCli realpath fix ab6e3fd is the prerequisite).
3. Publish wiring (AC#3): release.yml — after re-verify, build-npm + npm publish --provenance --access public, ordered BEFORE gh release create (tag is created by the release step, so a tag can never exist without its npm version live — kills the npx race). Idempotent: existing tag check already gates it; add npm-view skip for re-runs. Needs id-token:write + auth (user sets NPM_TOKEN or trusted publishing).
4. Swap action internals (AC#4): action.yml runs npx -y <name>@<pinned> instead of node from action_path; sync-version.mjs also stamps the action.yml pin. Contract unchanged — GATES/action.yml agreement test keeps holding; consumers' uses: line untouched.
5. Docs (AC#5): consuming-gates.md npm section (replace 'Planned'), releasing.md (publish step, secret, lockstep incl. action pin), README if needed; wiki-update pass; bump marketplace to 0.5.0.
6. Finalize: ACs, notes, final summary, Done; PR from task-17 branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Name decision: try @praxis org first (user claiming); fallback @evanstern/praxis-gates. Auth: NPM_TOKEN granular automation token as repo secret. Building name-parameterized with @praxis/gates default.

Carve done: scripts/build-npm.mjs + integration test (pack → extract → run bin via .bin symlink, contract exit codes hold). LICENSE (MIT) added at repo root per user choice.

release.yml wired: npm publish (provenance, --access public) ordered before tag creation; idempotent via tag check + npm view skip. Proof of first publish lands at merge; requires NPM_TOKEN secret (user).
<!-- SECTION:NOTES:END -->
