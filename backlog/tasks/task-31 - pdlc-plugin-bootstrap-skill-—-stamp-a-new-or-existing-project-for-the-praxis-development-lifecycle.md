---
id: TASK-31
title: >-
  pdlc plugin: bootstrap skill — stamp a new or existing project for the praxis
  development lifecycle
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-13 15:23'
updated_date: '2026-07-13 15:31'
labels: []
dependencies: []
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A new marketplace plugin `pdlc` whose `bootstrap` skill initializes a NEW or EXISTING project folder for the praxis development lifecycle (PDLC). Today every leg of the loop (grounding-wiki, gates, build, spec-bridge, codebase-to-course) assumes setup — folders, artifacts, and a project CLAUDE.md that knows what's what — but nothing plants that suite-wide; educate:start only covers its own leg. The skill plants the always-on PDLC grounding (CLAUDE.md), ensures the expected scaffolding (.handoff/ gitignore, docs landing spots), and treats Backlog.md and GitHub Spec Kit as officially supported peer utilities: recommend installing them when their CLIs are absent; when present, ask the user to opt in, and on opt-in run their init (backlog init / specify init, skipping if backlog/ or .specify/ already exist) and wire their conventions into the planted CLAUDE.md. Decisions from kickoff: suite-level home as a NEW plugin named pdlc; opt-in RUNS the peer inits rather than only printing instructions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 New plugin pdlc registered in .claude-plugin/marketplace.json, with its own .claude-plugin/plugin.json and committed lib -> ../lib symlink, per the new-plugin checklist in docs/skill-patterns.md
- [x] #2 pdlc:bootstrap skill follows the precondition-gate -> work -> output-gate shape with two modes: fresh install and idempotent update (safe to re-run on an already-bootstrapped project; never clobbers user-grown content; reconciles a user-edited CLAUDE.md with a shown diff + confirm)
- [x] #3 Plants a project CLAUDE.md template carrying the always-on PDLC grounding: the research->teach->build loop, each installed plugin's role and entry skill, the gates principle, and the .handoff/ transport — tailored to which peers were opted into
- [x] #4 Peer utility handling: detects the backlog and specify CLIs; absent -> names them officially supported and recommends installation; present -> asks to opt in; on opt-in runs backlog init / specify init (skipping when backlog/ or .specify/ already exist) and wires their conventions into the planted CLAUDE.md
- [x] #5 Scaffolding is ensured via lib/installer.mjs semantics (dotfile-safe copy, ensureGitignore .handoff/, installMode markers) and phase separation holds: bootstrap hands off to next skills (e.g. wiki-build) but never invokes sibling skills
- [x] #6 Skill verifies planted files on disk (verifyPresent semantics) before declaring success and reports exactly what was created, refreshed, skipped, and left untouched
- [ ] #7 Tests under test/ cover the new surface and node --test stays green; README plugin table + docs updated; marketplace version and the skill's own version bumped per docs/releasing.md
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-31-pdlc-bootstrap off main.
2. Scaffold the plugin: pdlc/.claude-plugin/plugin.json, committed lib -> ../lib symlink, pdlc/README.md; register in .claude-plugin/marketplace.json (or gen-marketplace).
3. Author pdlc/templates/CLAUDE.md — the planted always-on PDLC grounding: the loop, per-plugin roles + entry skills, gates principle, .handoff/ transport, with clearly-marked optional sections for Backlog.md and Spec Kit conventions.
4. Author pdlc/skills/bootstrap/SKILL.md in the gate->work->gate shape: pick root; installMode detection (fresh vs update) on a .pdlc marker + CLAUDE.md; peer-utility detection (backlog/specify CLIs) with recommend-if-absent / opt-in-if-present (opt-in runs their init, skipping existing backlog/ or .specify/); plant CLAUDE.md + ensure .handoff/ gitignore; verifyPresent-style verification + honest report; hand off to wiki-build etc. without invoking siblings.
5. Update mode: refresh boilerplate, diff+confirm a user-edited CLAUDE.md, leave user content alone.
6. Tests under test/ (template presence/structure, marketplace registration, symlink integrity — match existing test conventions); node --test green.
7. Docs: README plugin table + install list, skill-patterns/wiki touchpoints as needed; bump marketplace version (minor — new plugin) via scripts/sync-version.mjs + skill version stamp.
8. Wiki freshness pass (/grounding-wiki:wiki-update) if the gate fails; PR with merge-commit flow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: pdlc plugin scaffolded (plugin.json, lib symlink, README), templates/CLAUDE.md grounding block with pdlc:grounding + pdlc:peer:{backlog,spec-kit} markers, scripts/plant.mjs (dual-use CLI on lib/installer+template+cli: fresh/append/replace/unchanged/drifted semantics, drift never overwritten without --force, sentinel .pdlc never advances past an unconfirmed drift, --check writes nothing and exits 1 while pending), skills/bootstrap/SKILL.md (gate->work->gate; peer detect/recommend/opt-in with backlog init & specify init, skip when backlog/ or .specify/ exist; hands off to wiki-build/spec-bridge/c2c without invoking them). 10 new tests in test/pdlc.test.mjs; full suite 122 pass. README table/install/status updated; marketplace regenerated via gen-marketplace; version bumped 0.6.5 -> 0.7.0 via sync-version (minor: new plugin). Live smoke on scratch dir: append-to-existing-CLAUDE.md verified.
<!-- SECTION:NOTES:END -->
