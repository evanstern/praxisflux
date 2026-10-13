---
id: TASK-0137
title: 'explainer: adopt the explainer plugin into the praxisflux marketplace'
status: To Do
assignee: []
created_date: '2026-10-13 01:38'
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
- [ ] #1 The plugin lives at <repo-root>/explainer/ with a lib -> ../lib symlink and is listed in .claude-plugin/marketplace.json.
- [ ] #2 The plugin ships no package.json; repo-level build and version tooling packages it.
- [ ] #3 Read-only checks live in explainer/gates/ and never write to disk.
- [ ] #4 The output gate verifies every built page with lib/selfcontained.mjs.
- [ ] #5 No file cites an internal code with no shipped referent (TASK-12.x, build spec sections, E-series decision records).
- [ ] #6 The explainer test suite runs from the repo test/ directory and passes under node --test.
- [ ] #7 README.md, CLAUDE.md, and docs/wiki describe the new plugin, and scripts/check-docs.mjs passes.
- [ ] #8 The marketplace version is bumped per docs/releasing.md.
<!-- AC:END -->
