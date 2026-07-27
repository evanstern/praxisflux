---
id: TASK-66
title: >-
  scripts/template hygiene: hook quoting, build --plugin dist wipe, new-plugin
  count-claim contract, version-bump semver short-circuit
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-27 01:58'
updated_date: '2026-07-27 03:48'
labels:
  - downstream-bug-find
dependencies: []
priority: low
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Grouped low-severity hygiene. (1) Unquoted expansion in hook commands: educate|research|spec-bridge|team-review|reorient hooks/hooks.json:10 and the scaffold at scripts/new-plugin.mjs:116 use bash ${CLAUDE_PLUGIN_ROOT}/scripts/gate.sh unquoted — an install path containing a space word-splits and the Stop hook errors on every turn; the repo own .claude/settings.json already quotes the same expansion correctly. (2) scripts/build.mjs:37 — rmSync(dist) is unconditional, so --plugin <name> wipes all packaged copies and dist/npm to rebuild one plugin; and --plugin as the last argv yields targets=[undefined] -> join(repo, undefined) TypeError instead of a usage message. (3) scripts/new-plugin.mjs:2-5 header contract (a fresh plugin passes check-docs.mjs unmodified) is false: scaffolding never updates count-claim prose, README.md:9 says Nine plugins are registered, and check-docs.mjs:52-55 gates every <N> plugins claim against the marketplace count — scaffolding a 10th plugin leaves check-docs failing; untested because the fixture README in test/new-plugin.test.mjs:28-33 contains no count claim. (4) scripts/check-version-bump.mjs:77 — a skill whose base SKILL.md version is non-semver (e.g. v0.1.0) short-circuits the increase requirement entirely, so such a skill can be edited with no bump and pass.

Spec: specs/027-scripts-template-hygiene
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All shipped hook commands and the scaffold template quote the plugin-root expansion
- [ ] #2 build --plugin rebuilds only its target without destroying other dist output, and missing argv value prints usage instead of crashing
- [ ] #3 Scaffolding keeps check-docs green (count claims updated or contract amended); fixture README carries a count claim
- [ ] #4 Non-semver base skill versions fail loudly (or are validated) instead of skipping the bump check
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 027-scripts-template-hygiene (hand-authored spec/plan/tasks on branch task-66-scripts-template-hygiene) drives. 1. Quote the plugin-root expansion in all five plugins' hooks/hooks.json and the new-plugin.mjs scaffold. 2. build.mjs: --plugin rebuilds only its target (scoped clean), missing argv value prints usage. 3. new-plugin.mjs keeps check-docs green (count claims updated or contract amended); fixture README gains a count claim. 4. check-version-bump.mjs: non-semver base versions fail loudly instead of skipping. 5. Tests + versions + wiki re-ground (build-and-release, release-pipeline, skill-patterns notes). See specs/027-scripts-template-hygiene/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane G tail — last by design, quiet main at 0.35.0 after #83–#90): tier = default implementer — grouped mechanical hygiene across five plugins' hooks and three repo scripts.
<!-- SECTION:NOTES:END -->
