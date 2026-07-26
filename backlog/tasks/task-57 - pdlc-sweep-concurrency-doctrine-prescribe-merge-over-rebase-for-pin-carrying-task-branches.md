---
id: TASK-57
title: >-
  pdlc:sweep concurrency doctrine: prescribe merge-over-rebase for pin-carrying
  task branches
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-26 21:08'
updated_date: '2026-07-26 22:29'
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

Spec: specs/018-sweep-merge-over-rebase
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 sweep concurrency doctrine (SKILL.md + templates/runbook.md): pin-carrying task branches reconcile by MERGING origin/main in and re-pinning conflicted pins to the merge commit; squash/rebase/force-push named as pin-breaking; rebase stays for pin-free branches
- [x] #2 freshness probe prescribed directly after EVERY history move, not only when docs/wiki/ changed — pins also reference design-reference files, so a wiki-untouched diff can still be stale
- [x] #3 Versions bumped per docs/releasing.md (pdlc released surface: sweep SKILL.md + marketplace); wiki pdlc-plugin note re-verified + re-pinned
- [ ] #4 Spec phase: Spec
- [ ] #5 Spec phase: Implement
- [ ] #6 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 018-sweep-merge-over-rebase (hand-authored: spec/plan/tasks)
2. spec-bridge:link to TASK-57
3. Implement: rewrite sweep SKILL.md step-7 + concurrency doctrine and templates/runbook.md doctrine — merge-over-rebase for pin-carrying branches, re-pin conflicts to the merge commit, freshness probe after every history move
4. Versions: sweep SKILL.md 0.5.0→0.6.0, marketplace sync-version 0.27.0
5. Re-ground: wiki-update re-pin pdlc-plugin (+ lockstep), CAPSULES if descriptions change
6. Gates: check-docs.mjs, wiki freshness, tests; PR
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doctrine rewritten in SKILL.md (step 7 + concurrency doctrine) and templates/runbook.md: pin-carrying branches merge origin/main in and re-pin conflicts to the merge commit; squash/rebase/force-push named as the three pin-breaking moves; PR lands as merge commit never squash; rebase kept for pin-free branches. Freshness probe prescribed unconditionally after every history move in both files. Versions: sweep skill 0.5.0→0.6.0, marketplace 0.26.0→0.27.0.

Wiki re-ground: 9 stamp-only re-pins executed verbatim; build-and-release/reorient/team-review literals verified then re-pinned; pdlc-plugin re-verified against the doctrine diff. Body went 753 over the 8000-char budget (note was at 7,996 pre-task) — split summary-style per corpus spec: sweep coverage moved to new note pdlc-sweep (own sources: skills/sweep/*), pdlc-plugin keeps a routed summary; INDEX line added, CAPSULES regenerated. Freshness gate: 29 notes fresh, plan empty.
<!-- SECTION:NOTES:END -->
