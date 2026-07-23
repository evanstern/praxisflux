---
id: TASK-36
title: 'new-plugin.mjs scaffolder: stamp the full checklist surface for a new plugin'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-23 16:59'
updated_date: '2026-07-23 17:10'
labels: []
dependencies: []
priority: medium
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Review idea 6 from TASK-35's vendored spec input (docs/handoffs/team-review-iteration-3-review.md): turn the new-plugin checklist (docs/skill-patterns.md) into a scaffolder so the next plugin author gets a paved road instead of five hand-edits. scripts/new-plugin.mjs <name> stamps exactly the set the existing drift gates demand: <name>/.claude-plugin/plugin.json (version lockstep with the marketplace), skills/<name>/SKILL.md skeleton in the gate->work->gate shape with the frontmatter the bump gate keys on (name, version, description), the lib -> ../lib symlink, the marketplace entry (via the now-generative gen-marketplace.mjs from TASK-35.1), and the README table row + install line that check-docs.mjs requires. Should also offer the optional pieces as flags or TODO stubs: gates/ + scripts/{stop.mjs,gate.sh} + hooks/hooks.json for a Stop-hook plugin (per the uniform convention in skill-patterns section 5). team-review was transplanted by hand; the ninth plugin should be the scaffolder's first consumer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 node scripts/new-plugin.mjs <name> produces a plugin dir that passes check-docs.mjs, gen-marketplace.mjs --check, sync-version.mjs --check, and node --test unmodified
- [x] #2 The stamped SKILL.md skeleton carries the frontmatter the bump gate keys on and the gate->work->gate section structure
- [x] #3 A test scaffolds a plugin into a fixture repo and asserts the drift checks pass; running the scaffolder twice fails safely rather than clobbering
- [x] #4 docs/skill-patterns.md's new-plugin checklist names the scaffolder as the paved path
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/new-plugin.mjs exporting scaffoldPlugin(repo, name, {withGate}): validate kebab-case name, refuse if <repo>/<name> exists (fail-safe rerun); read marketplace version; stamp .claude-plugin/plugin.json (version lockstep), skills/<name>/SKILL.md skeleton (frontmatter name/version/description + gate->work->gate sections), lib -> ../lib symlink; register via genMarketplace() and write marketplace.json; insert README plugins-table row + /plugin install line (the exact strings check-docs.mjs demands).
2. --with-gate flag stamps the Stop-hook trio per skill-patterns section 5: gates/<name>.mjs stub, scripts/{stop.mjs,gate.sh}, hooks/hooks.json (modeled on team-review).
3. test/new-plugin.test.mjs: scaffold into a fixture repo; assert checkDocs(fixture) is empty, genMarketplace(fixture) is a no-op, plugin.json version == marketplace version, SKILL.md frontmatter parses, symlink resolves; second run throws without clobbering; --with-gate variant stamps the trio.
4. Verify AC1 in the real repo: run the scaffolder, run check-docs / gen-marketplace --check / sync-version --check / node --test, then remove the scratch plugin.
5. docs/skill-patterns.md checklist: name the scaffolder as the paved path.
6. Release chores: sync-version bump (scripts/ is released surface), wiki repin commit last, per-task course docs/courses/TASK-36.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
scripts/new-plugin.mjs + test/new-plugin.test.mjs landed. Verified AC1 end-to-end in the real repo: scaffolded scratch-demo --with-gate, then check-docs, gen-marketplace --check, sync-version --check, and node --test (142 pass) all green unmodified; scratch plugin reverted. Fixture tests cover drift-check pass, fail-safe rerun, --with-gate trio (no-op stub gate), and kebab-case rejection.

docs/skill-patterns.md checklist now leads with the scaffolder as the paved path, marking which items it stamps vs. which stay manual.
<!-- SECTION:NOTES:END -->
