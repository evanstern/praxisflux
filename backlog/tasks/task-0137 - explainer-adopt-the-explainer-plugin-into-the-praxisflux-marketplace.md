---
id: TASK-0137
title: 'explainer: adopt the explainer plugin into the praxisflux marketplace'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-13 01:38'
updated_date: '2026-10-15 16:15'
labels:
  - plugin
  - explainer
dependencies: []
references:
  - /Users/evanstern/projects/explainer-plugin-clean
  - docs/skill-patterns.md
  - docs/releasing.md
priority: medium
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adopt the explainer plugin as a praxisflux plugin. The plugin builds cited, house-style HTML explainers: PR explainers, architecture sites, decision briefings, and onboarding guides.

Source of truth: /Users/evanstern/projects/explainer-plugin-clean (a local git repo, not on GitHub).
- Commit 88734bb holds the pristine extract of the original tarball.
- Commit ebfda5d strips all organization references and drops the org-specific refresh-brand verb.
- Run its suite with: node --test scripts/test/*.test.mjs (584 pass at ebfda5d).

Why: the explainer overlaps three praxisflux surfaces. It renders self-contained HTML like codebase-to-course and research:vault-artifact. It gathers cited facts like grounding-wiki. It answers artifact comment threads, which no praxisflux plugin does today. Adopting it gives the suite a render phase for PRs and decisions.

Gaps against docs/skill-patterns.md:
- The plugin carries its own package.json and a private scripts/lib/. praxisflux plugins share lib/ through a symlink and carry no package.json.
- Its check verb mixes read-only checks with writes. praxisflux puts read-only checks in <plugin>/gates/.
- It has no output gate tied to lib/selfcontained.mjs, no planted CLAUDE.md block, and no Stop hook.
- About 266 comments cite internal codes (TASK-12.x, build spec sections, decision records E1b/E3a). The referenced spec doc does not ship with the plugin.
- Its fact-gatherer does not read docs/wiki. A grounded host already holds verified facts there.

Open decisions for the spec:
1. Plugin name: explainer or explain.
2. Read docs/wiki as a fact source, or keep fact gathering independent.
3. Keep the browser checks (Playwright or headless Chrome) or make them CI-only.
4. Relationship to codebase-to-course: shared patterns in lib/, or separate libraries.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The plugin lives at <repo-root>/explainer/ with a lib -> ../lib symlink and is listed in .claude-plugin/marketplace.json.
- [x] #2 The plugin ships no package.json; repo-level build and version tooling packages it.
- [x] #3 Read-only checks live in explainer/gates/ and never write to disk.
- [x] #4 The output gate verifies every built page with lib/selfcontained.mjs.
- [x] #5 No file cites an internal code with no shipped referent (TASK-12.x, build spec sections, E-series decision records).
- [x] #6 The explainer test suite runs from the repo test/ directory and passes under node --test.
- [x] #7 README.md, CLAUDE.md, and docs/wiki describe the new plugin, and scripts/check-docs.mjs passes.
- [x] #8 The marketplace version is bumped per docs/releasing.md.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold explainer/ via new-plugin.mjs --with-gate; copy source from the clean repo.
2. Move the suite to test/explainer/; fix plugin-root paths.
3. Split check: read-only checks to gates/check.mjs; scripts/lib/check.mjs keeps browser runs and report writes.
4. Route self.contained through lib/selfcontained.mjs; teach it protocol-relative URLs.
5. Wire the Stop hook: built dist pages must stay self-contained.
6. Plant a marked CLAUDE.md block in host projects (explainer.mjs plant).
7. Add docs/wiki as a fact source; warn when a cited wiki note is stale.
8. Docs sync (README, CLAUDE.md, wiki), version bump, full gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Branch task-0137-explainer-plugin, commits 617c27c (adoption) and 1d28e7a (wiki re-ground).
- Suite: node --test 1231/1231 (explainer 587 in test/explainer/).
- Gates: gen-marketplace --check, sync-version --check (0.66.0), build.mjs (lib dereferenced, no tests packaged), check-docs, wiki freshness (44 notes) all pass.
- lib/selfcontained.mjs gained externalLoads() and counts protocol-relative URLs as external; existing callers unchanged.
- Wiki added as a source kind (all four profiles), fact-gatherer/fact-checker prompts, and a wiki.fresh warning check.
- explainer.mjs plant replaces the sources stub; Stop hook keeps dist/ self-contained.
Not done: push and PR — awaiting operator review.

CI fix on PR #154: plant --check failed (claudeMd drifted) because the 0.66.0 bump left the planted CLAUDE.md marker and .pdlc at 0.65.3 — the same drift each release has needed a hand re-stamp for (8526891, b1cf2bd). sync-version.mjs now stamps both and reports them in --check (ef405b1, test added); wiki re-pinned in 46fb3a0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adopted the explainer plugin into the marketplace (PR #154, merged 2a430cf, v0.66.0). explainer/ shares lib/ via symlink, ships no package.json, keeps read-only checks in explainer/gates/, verifies built pages with lib/selfcontained.mjs (which gained externalLoads() and treats protocol-relative URLs as external), reads docs/wiki as a fact source with a warning-level wiki.fresh check, and plants a CLAUDE.md block. Suite in test/explainer/. Also fixed the recurring CI plant drift: sync-version.mjs now stamps the planted CLAUDE.md marker and .pdlc. No Dispatch: line was recorded; the operator merged without one.
<!-- SECTION:FINAL_SUMMARY:END -->
