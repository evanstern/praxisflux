---
id: TASK-57
title: >-
  pdlc:sweep concurrency doctrine: prescribe merge-over-rebase for pin-carrying
  task branches
status: To Do
assignee: []
created_date: '2026-07-26 21:08'
labels:
  - pdlc
  - sweep
  - doctrine
dependencies: []
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Field evidence from the promptworld reorient 2026-07-26 sweep (runbook docs/design/reorient-2026-07-26-sweep-runbook.md, PRs #113/#115/#116/#119): the sweep skill's concurrency doctrine says 'rebase, never merge-commit into a task branch', but on hosts with the spec-069-style wiki-in-PR lifecycle, in-branch re-pins are BRANCH COMMIT HASHES — a rebase rewrites them and stales every pin the branch carries (43 pins on one lane, 89 on another). All three history-rewriting moves (squash, rebase, force-push) break pins; only merge commits keep old hashes reachable. Three lanes merged origin/main into their branch instead; the merge-drift pr gate accepted it every time; operator ratified 2026-07-26 ('we want merges over rebases to preserve those hashes').

Fix in the sweep skill (skills/sweep/SKILL.md + templates/runbook.md concurrency doctrine): pin-carrying branches reconcile by merging origin/main in and re-pinning conflicted pins to the merge commit; rebase remains fine for pin-free branches. Also close the sibling gate gap found on the same sweep: the merge-drift pr gate's player-docs-stale probe only fires when docs/wiki/ changed, but player pages also pin design-reference files (docs/design/tui/*) — a keymap.md-only change went stale invisibly; the freshness probe must be prescribed to run directly after every history move.
<!-- SECTION:DESCRIPTION:END -->
