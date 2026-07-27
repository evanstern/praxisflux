---
id: TASK-66
title: >-
  scripts/template hygiene: hook quoting, build --plugin dist wipe, new-plugin
  count-claim contract, version-bump semver short-circuit
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:58'
updated_date: '2026-07-27 04:11'
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
- [x] #1 All shipped hook commands and the scaffold template quote the plugin-root expansion
- [x] #2 build --plugin rebuilds only its target without destroying other dist output, and missing argv value prints usage instead of crashing
- [x] #3 Scaffolding keeps check-docs green (count claims updated or contract amended); fixture README carries a count claim
- [x] #4 Non-semver base skill versions fail loudly (or are validated) instead of skipping the bump check
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
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

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Tooling hygiene shipped (branch task-66-scripts-template-hygiene; PR pending merge). (1) Plugin-root expansion quoted in all five plugins' hooks/hooks.json and the new-plugin.mjs scaffold template; per-plugin regression test installs into a spaced path and spawns the exact Stop command. (2) build.mjs: exported buildPlugins(repo, only) — full build wipes dist/, --plugin <name> cleans only dist/<name>/ (siblings + dist/npm survive), unknown plugin throws before any clean, bare --plugin prints usage exit 2; new test/build.test.mjs. (3) new-plugin.mjs: exported updateCountClaims mirrors check-docs' census — scaffolding rewrites every "<N> plugins" claim (words stay words, digits stay digits, >20 falls back to digits); header contract now true; fixture README carries word + digit claims plus a non-claim guard. (4) check-version-bump.mjs: a non-semver base skill version is a named failure instead of skipping the increase requirement; valid semver paths byte-unchanged. Versions: marketplace 0.36.0 (no SKILL.md changed → no skill bumps, bump gate concurs). Wiki: skill-patterns, release-pipeline, test-suite-catalog, chassis amended + re-pinned; build-and-release was at exactly 8000/8000 chars and R2 grew its content, so the sanctioned minimal summary-style split created docs/wiki/dist-packaging.md (packaging mechanics + scoped-clean/argv contract); five plugin notes reviewed unamended; 11 lockstep stales classified per the honest plan loop; CAPSULES regenerated. Gates green at HEAD: node --test 241 tests 0 fail, check-docs, wiki freshness 31/31, bump gate 0.35.0 → 0.36.0. Follow-up candidate surfaced (not carded): test-suite-catalog covers only 22 of 27 test files (pre-existing partial coverage).
<!-- SECTION:FINAL_SUMMARY:END -->
