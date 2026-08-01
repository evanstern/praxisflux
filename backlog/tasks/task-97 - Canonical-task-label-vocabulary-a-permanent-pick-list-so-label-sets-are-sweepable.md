---
id: TASK-97
title: >-
  Canonical task-label vocabulary: a permanent pick-list so label sets are
  sweepable
status: Done
assignee:
  - '@claude'
created_date: '2026-08-01 14:21'
updated_date: '2026-08-01 14:23'
labels:
  - docs
  - doctrine
dependencies: []
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Labels are the board's selector surface, but the vocabulary grew organically and drifted: 25 distinct labels across the board, several one-offs (`html`, `design`, `sweep`), near-duplicates (`sweep` vs `pdlc-sweep`, `wiki-token-economy` vs a general wiki label), and no rule for when a new one is warranted. Open cards mostly carried a Kind label (`debt`) and nothing saying WHERE the work lands, so no set of cards was addressable as a set.

That matters concretely for pdlc:sweep, which already accepts a label as an input mode alongside task ids and a synthesis doc — but only if labels reliably name an area. The goal is that 'sweep the demo-rig tasks' resolves to exactly the right cards.

Fix: a tracked pick-list at docs/task-labels.md defining three axes — Area (tracks real repo surfaces, so it does not churn), Kind, and Provenance — plus the reserved machine-read `paused` that sweep and the merge-drift gates already consume. The list carries an explicit minting rule (a new label needs more than two cards behind it, and lands in the file in the same change that applies it) so the vocabulary cannot drift behind the board again. Organic labels already past that bar (`pdlc-sweep`, `sweep-cost`) are folded in rather than overridden; genuine one-offs are recorded as retired rather than rewritten onto closed cards.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/task-labels.md defines the Area/Kind/Provenance axes plus the reserved paused label, and states the minting rule (>2 cards) and the CLI-only editing rule
- [x] #2 The vocabulary reconciles with labels actually in use: organic labels past the bar are folded in, genuine one-offs are listed as retired, and closed cards are left unchanged
- [x] #3 Every open task carries at least one Area label, and a label selector (backlog task list --labels X) returns exactly the intended set
- [x] #4 check-docs, wiki-freshness, and spec-bridge gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Survey the labels actually in use across backlog/ (all dirs, not just tasks/) to separate real categories from one-offs.
2. Author docs/task-labels.md: three axes (Area tracking repo surfaces, Kind, Provenance) + reserved paused; state the >2-card minting rule and the CLI-only editing rule.
3. Fold in organic labels already past the bar (pdlc-sweep, sweep-cost); list genuine one-offs as retired rather than rewriting closed cards.
4. Apply Area labels to every open card via the backlog CLI, one --add-label per invocation (repeated flags silently keep only the last), reading back each result.
5. Verify a selector query returns exactly the intended set; run check-docs + wiki-freshness + spec-bridge.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered docs/task-labels.md (three axes + reserved paused, minting rule, CLI-only rule). Vocabulary reconciled against the board: folded in pdlc-sweep (6 cards) and sweep-cost (3), both organic and past the >2 bar; retired sweep in favour of pdlc-sweep, and listed wiki-token-economy/handoff/design/html as retired rather than rewriting closed cards. Area labels applied to all three open cards (TASK-91, TASK-92, TASK-97). Recorded a CLI trap in the doc's rules: backlog task edit --add-label honours only the LAST flag per invocation while still reporting success, so a batched call silently drops labels — run one invocation per label and read back.

Note for reviewers: this branch touches TASK-92's card (adding docs/doctrine labels) while TASK-92 is still In Progress in another worktree. The edit is additive frontmatter only; if its owner finalises concurrently, expect a trivial labels-block merge.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added docs/task-labels.md as the board's canonical label pick-list, so a set of cards is addressable as a set and pdlc:sweep can be handed a label instead of a hand-typed id list. Three axes: Area (keyed to real repo surfaces, so it does not churn), Kind, and Provenance, plus the reserved machine-read paused that sweep and the merge-drift gates already consume. The minting rule (a new label needs more than two cards, and lands in the file in the same change that applies it) is what stops the vocabulary drifting behind the board again.

Reconciled rather than imposed: pdlc-sweep and sweep-cost were already organic and past the bar, so they are folded in; genuine one-offs (sweep, wiki-token-economy, handoff, design, html) are recorded as retired rather than rewritten onto closed cards. All three open cards now carry an Area label.
<!-- SECTION:FINAL_SUMMARY:END -->
