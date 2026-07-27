---
id: TASK-60
title: >-
  pdlc:sweep doctrine reconciliation: claim ordering, rebase leftover, gate-mode
  inventory, Done ownership, planted-hook overclaim
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:57'
updated_date: '2026-07-27 03:35'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Five internal contradictions in the sweep doctrine set. (1) Claim ordering: SKILL.md:116-127 Phase 2 loop authors the full Spec Kit cycle before any branch or commit exists (and cuts the worktree from origin/main, which will not contain the spec), while templates/runbook.md:79-82 requires the first commit of any task to claim it BEFORE any spec authoring; the SKILL loop has no claim step at all, and docs/wiki/pdlc-sweep.md papers over it with a merged sequence neither file states. (2) runbook.md:83-86 still says rebase and re-push the claim — TASK-57 amended SKILL.md:178-180 to merge-over-rebase and names rebase a pin-breaking move; as written the remedy is unexecutable on hosts that hook-block rebase (promptworld) and, for an already-pushed claim branch, requires the force-push the same paragraph forbids; the wiki re-ground (345922b) quietly softened this to reconcile-and-repush so wiki and shipped template disagree. (3) SKILL.md:39-45 documents a 3-mode host drift gate (session/worktree/pr) while runbook.md:87-91 mandates a 4th mode (claim --dir) the SKILL never probes for (SKILL.md:90-91 records three invocations verbatim). (4) SKILL.md:144-149 orders spec-bridge:sync BEFORE ticking tasks.md (sync sees unchecked boxes, moves nothing) then marks Done manually, while spec-bridge/skills/sync/SKILL.md:31-34 declares sync the ONLY path to Done. (5) pdlc/templates/CLAUDE.md:54-55 plants Plugins ship Stop hooks that enforce this, but grounding-wiki ships no hook at all — hosts are told a gate exists that nothing installs.

Spec: specs/025-sweep-doctrine-reconcile
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL Phase 2 loop and runbook claim protocol state one consistent ordering (claim commit precedes spec authoring), and the SKILL loop contains an explicit claim step
- [x] #2 Rejected-claim-push remedy is merge-based, executable under a repo-wide rebase ban, and never requires a force-push; wiki and template agree
- [x] #3 Drift-gate mode inventory is identical between SKILL and runbook (all four modes, probed for)
- [x] #4 Re-ground step order makes the sync call effective (ticks before sync) and Done ownership matches spec-bridge doctrine
- [x] #5 Planted CLAUDE.md enforcement claims match what plugins actually ship
- [x] #6 Spec phase: Spec
- [x] #7 Spec phase: Implement
- [x] #8 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 025-sweep-doctrine-reconcile (hand-authored spec/plan/tasks on branch task-60-sweep-doctrine-reconcile) drives; works on the post-TASK-58 text. 1. Claim step written into the SKILL Phase 2 loop, ordered claim-before-spec, consistent with the runbook template. 2. Rejected-claim remedy rewritten merge-based (no force-push, executable under a rebase ban); wiki and template agree. 3. Drift-gate mode inventory unified (4 modes incl. claim --dir, probed). 4. Re-ground order: ticks before sync; Done ownership per spec-bridge doctrine. 5. Planted CLAUDE.md enforcement claims match shipped hooks. 6. Versions + wiki re-ground (pdlc-sweep, pdlc-plugin notes). See specs/025-sweep-doctrine-reconcile/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane A second, after TASK-58 merged — same files): tier = default implementer — five bounded text reconciliations across the sweep doctrine set.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sweep doctrine set reconciled to one story (branch task-60-sweep-doctrine-reconcile; PR pending merge). (1) The SKILL Phase 2 loop gained an explicit claim step: worktree cut from origin/main (stated outright that it does not yet contain the spec); first commit = board In Progress + spec dir stub, push -u, never force-push; Spec Kit cycle authored on the claimed branch; runbook claim paragraph aligned. (2) Rejected-claim remedy in both files is merge-based (fetch + merge origin/main + plain re-push) — rebase-ban-safe, no force-push; wiki states the same rule. (3) Drift-gate inventory identical in both files: four modes (session/claim/worktree/pr) probed at the precondition gate, invocations verbatim. (4) Re-ground order: tick tasks.md at root FIRST, then spec-bridge:sync — sync's derived plan named the only path to Done; hand-set-Done phrasing removed. (5) Planted CLAUDE.md Gates rule states ship-reality (spec-bridge/educate/research/reorient/team-review ship Stop hooks; grounding-wiki freshness is check-scripts/CI; build/codebase-to-course/pdlc ship none — verified against each hooks/hooks.json). Versions: sweep skill 0.8.0, bootstrap 0.6.0 (template's owning skill per TASK-51 precedent), marketplace 0.34.0. Wiki: pdlc-sweep + pdlc-plugin re-grounded with Since-0.34.0 phrasing; 11 lockstep notes classified per the honest-re-pin loop (dogfooding the amended doctrine); CAPSULES regenerated. Reconciled with post-61/62/65/59/64 main by merge-in (a7fab09). Gates green at HEAD: node --test 230/230, check-docs, wiki freshness 30 notes under the stricter TASK-59 gate, bump gate 0.33.0 → 0.34.0. Post-merge follow-up flagged (needs operator approval): pdlc:bootstrap replant so the repo's own planted CLAUDE.md block picks up the corrected enforcement sentence.
<!-- SECTION:FINAL_SUMMARY:END -->
