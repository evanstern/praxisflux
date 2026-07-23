---
id: TASK-36
title: 'new-plugin.mjs scaffolder: stamp the full checklist surface for a new plugin'
status: To Do
assignee: []
created_date: '2026-07-23 16:59'
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
- [ ] #1 node scripts/new-plugin.mjs <name> produces a plugin dir that passes check-docs.mjs, gen-marketplace.mjs --check, sync-version.mjs --check, and node --test unmodified
- [ ] #2 The stamped SKILL.md skeleton carries the frontmatter the bump gate keys on and the gate->work->gate section structure
- [ ] #3 A test scaffolds a plugin into a fixture repo and asserts the drift checks pass; running the scaffolder twice fails safely rather than clobbering
- [ ] #4 docs/skill-patterns.md's new-plugin checklist names the scaffolder as the paved path
<!-- AC:END -->
