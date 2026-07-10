---
id: TASK-14
title: >-
  Docs-sync enforcement: wiki freshness + README/CLAUDE.md structural checks on
  every PR and at Stop
status: Done
assignee:
  - '@claude'
created_date: '2026-07-10 14:25'
updated_date: '2026-07-10 14:32'
labels: []
dependencies: []
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The grounding docs (docs/wiki, README.md, CLAUDE.md) matter more than the code at AI scale — they ground SPEC-driven development. Today nothing enforces their sync: the wiki drifted 12 notes + a whole plugin behind before a manual /wiki-update caught it. Make doc-sync a blocking gate, same house rule as everything else: status (a mergeable PR) can't exceed proven artifacts (fresh docs).

Design:
- CI (blocking, every PR): run the existing wiki freshness gate (node grounding-wiki/gates/cli.mjs freshness . docs/wiki) — a PR touching any note's sources must include the wiki refresh in-branch. Plus a NEW scripts/check-docs.mjs for the deterministic README/CLAUDE.md surface: every marketplace plugin has a README table row and install line; every lib/*.mjs chassis module is named in README's chassis list; CLAUDE.md links docs/releasing.md. (Semantic prose freshness can't be machine-checked; the wiki corpus covers that — overview.md sources README+CLAUDE.md, so their edits stale the wiki and pull the refresh loop in.)
- Session enforcement: repo-local Stop hook (.claude/settings.json + a small scripts/stop-docs.mjs on lib/gate-runner, honoring stop_hook_active) that blocks finishing a turn while the freshness gate or check-docs fails — the agent must sync docs before it can stop, i.e. every PR we generate gets the sync automatically.
- Local hooks: pre-commit gains check-docs; pre-push gains the freshness gate.
- CLAUDE.md: document the rule in the working flow (docs sync is part of every slice; merge PRs with merge commits, never squash — squash would orphan the commits wiki pins point at).
- This PR touches scripts/ (released surface) → bump 0.3.0 (minor: new enforcement behavior).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 scripts/check-docs.mjs fails when a marketplace plugin lacks a README table row or install line, when a lib/*.mjs module is missing from README's chassis list, or when CLAUDE.md doesn't link docs/releasing.md; node --test covers pass and each failure
- [x] #2 ci.yml runs the wiki freshness gate and check-docs on every PR (blocking)
- [x] #3 A tracked .claude/settings.json Stop hook blocks ending a turn while docs/wiki is stale or check-docs fails, honoring stop_hook_active
- [x] #4 pre-commit runs check-docs; pre-push runs the freshness gate
- [x] #5 CLAUDE.md documents the docs-sync rule and the merge-commit (no squash) requirement
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/check-docs.mjs (pure checkDocs(root) + CLI): marketplace plugins ↔ README table rows + install lines; lib/*.mjs ↔ README chassis list; CLAUDE.md → docs/releasing.md link. Tests: fixture per failure + real-repo pass.
2. Fix whatever check-docs flags in the real README (dogfood).
3. ci.yml: add freshness gate + check-docs steps.
4. scripts/stop-docs.mjs on lib/gate-runner (no-op outside praxis via docs/wiki/INDEX.md marker) + tracked .claude/settings.json Stop hook.
5. .githooks: pre-commit += check-docs; pre-push += freshness gate.
6. CLAUDE.md: docs-sync rule + merge-commit-only note. Bump 0.3.0.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
check-docs.mjs + tests green; immediately caught real drift (lib/handoff.mjs absent from README's chassis list) — fixed.

Validation: full suite green via pre-commit (incl. 6 new check-docs tests); stop-docs.mjs exercised by hand — blocked (exit 2) on the branch's own mid-work staleness, allowed after the wiki pass, honors stop_hook_active; freshness 22/22; bump gate ok 0.2.0→0.3.0. The dogfood loop fired for real: editing README staled overview.md, and the branch's closing wiki pass was forced by the very gates it adds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Docs-sync is now enforced, not aspirational. New scripts/check-docs.mjs (README must name every marketplace plugin — table row + install line — and every lib/*.mjs chassis module; CLAUDE.md must link docs/releasing.md); it immediately caught real drift (handoff.mjs missing from README). The wiki freshness gate + check-docs now run in four places: CI on every PR (blocking), pre-commit (check-docs), pre-push (freshness), and a tracked .claude/settings.json Stop hook (scripts/stop-docs.mjs on lib/gate-runner, praxis-repo-only, honors stop_hook_active) so a session turn can't end with stale grounding docs. CLAUDE.md documents the rule and the merge-commit-only requirement (squash would orphan wiki pins). Bumped 0.3.0; wiki re-verified 9 notes against the branch.
<!-- SECTION:FINAL_SUMMARY:END -->
