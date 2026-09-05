---
id: TASK-116
title: >-
  pdlc:bootstrap — local-only planting mode: PDLC artifacts ride
  .git/info/exclude so a host repo's tracked tree stays untouched
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-05 00:18'
updated_date: '2026-09-05 00:31'
labels:
  - pdlc
  - feature
  - doctrine
  - downstream-bug-find
dependencies: []
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Today `plant.mjs` assumes the host repo IS the praxisflux project: it appends `.handoff/` to the host's tracked `.gitignore` and lands CLAUDE.md, `.pdlc`, AGENTS.md, `.claude/agents/`, and `model-tiers.json` as ordinary files the host is expected to commit. That is right when you are bootstrapping your own project, and wrong when PDLC is a tool an operator brings to a repo they share with a team that has not adopted it. There is no opt-out.

kofile/ai-coe-plugins has been running the alternative by hand since 2026-08-27 (`.pdlc` v0.56.0, peers backlog + spec-kit) and it works. Every PDLC artifact is listed in `.git/info/exclude` instead of `.gitignore`:

    /.pdlc  /CLAUDE.md  /AGENTS.md  /.handoff/  /.worktrees/
    /backlog/  /specs/  /docs/wiki/  /.specify/
    /.claude/settings.json  /.claude/hooks/  /.claude/commands/
    /.claude/agents/  /.claude/skills/  /.claude/model-tiers.json

`info/exclude` is per-clone and never committed, so the host's tracked tree and its own `.gitignore` are untouched, `git status` stays clean, and nobody who clones the repo inherits a PDLC-shaped project. The full lifecycle still runs — board, specs, wiki, sweeps, worktrees — it just leaves no trace in the shared history. Observed leakage in that repo is only `.claude/plans/` and `.claude/routes/`, which belong to an unrelated plugin, not to pdlc.

Export the pattern: a local-only mode on `plant.mjs` that writes the same artifacts but routes the ignore lines to `.git/info/exclude`, records the mode in the `.pdlc` sentinel so `--check` and re-plants stay idempotent, and is OFFERED BY THE BOOTSTRAP SKILL as an explicit operator question — the same shape as the existing peer and hook opt-ins, not a flag you have to already know about. Bootstrap should ask whether this project is one we own (tracked planting, today's default) or one we are a guest in (local-only), and recommend based on what it can see: a repo whose remote/tracked tree shows no prior PDLC adoption is the guest case.

Two real edges. `.git/info/exclude` does not exist before `git init` — bootstrap already handles the pre-git case and must degrade the same way. And the exclude entries have to land BEFORE the artifacts are written, or the first plant dirties `git status` in exactly the repo where that is the whole point.

Spec: specs/060-local-only-planting
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 plant.mjs takes a local-only mode that appends the PDLC artifact set to .git/info/exclude instead of the host's tracked .gitignore, and writes nothing to .gitignore in that mode
- [ ] #2 The excluded set covers every artifact pdlc plants or a peer init creates (sentinel, CLAUDE.md, AGENTS.md, .handoff/, .worktrees/, backlog/, specs/, docs/wiki/, .specify/, and the .claude/ paths), scoped to the peers and hooks actually opted into
- [ ] #3 Exclude entries are written BEFORE any artifact is created, so a first plant in a clean host leaves git status clean
- [ ] #4 The mode is recorded in the .pdlc sentinel; re-planting and --check are idempotent and report unchanged, and switching modes surfaces as honest drift needing consent
- [ ] #5 pdlc:bootstrap ASKS the operator whether to plant tracked or local-only, presenting it like the existing peer/hook opt-ins with a recommendation grounded in what it can observe about the repo; the choice is re-presented as a default on update
- [ ] #6 Pre-git-init hosts degrade the same way tracked planting already does, with no crash and a stated next step
- [ ] #7 test/pdlc.test.mjs pins local-only planting: exclude file targeted, .gitignore untouched, ordering, sentinel round-trip, and the bootstrap question's presence in SKILL.md
- [ ] #8 Wiki re-pinned for any note whose sources this change touches; gates green
- [ ] #9 Spec phase: Phase 1 — The exclude helper and the scoped set
- [ ] #10 Spec phase: Phase 2 — Wire local-only into plant(), ordering first
- [ ] #11 Spec phase: Phase 3 — Sentinel round-trip and mode-switch drift
- [ ] #12 Spec phase: Phase 4 — The bootstrap question
- [ ] #13 Spec phase: Phase 5 — Bump, re-ground, PR
<!-- AC:END -->
