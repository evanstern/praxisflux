---
id: TASK-63
title: >-
  educate<->build handoff seam: nobody owns writing handoff.returned; loose
  HANDOFF.md doctrine contradictions; dangling protocol refs
status: Done
assignee:
  - '@claude'
created_date: '2026-07-27 01:57'
updated_date: '2026-07-27 03:46'
labels:
  - downstream-bug-find
dependencies: []
priority: medium
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The recorded contract has no owner for the evidence the gate demands: educate/skills/lesson/SKILL.md:80-82 asserts the build plugin sets handoff.returned=true and status built, but build/skills/implement/SKILL.md contains no instruction to touch progress.json — it only writes the .handoff/ response. A delegated build run in its own session therefore leaves the lesson at spec-d with handoff.returned unset, and educate/gates/dod.mjs:99-100 blocks any status >= built forever. Compounding doctrine drift: lesson SKILL.md:54-55 names loose HANDOFF.md / POST_BUILD_HANDOFF.md lifecycle artifacts while :74-76 forbids exactly those loose files; educate/templates/CLAUDE.md:14-15,21-22 has the same internal contradiction; and gates/dod.mjs:16-17 still derives artifacts.handoff/postBuild from those loose filenames on disk, blessing the drift. Also: build/skills/implement/SKILL.md:11 and lesson SKILL.md:76 point at docs/handoff-protocol.md, which does not exist under either plugin root (only at repo root, outside what the marketplace serves) — from a user project the pointer resolves to nothing.

Spec: specs/026-handoff-seam-ownership
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Exactly one side of the seam owns the progress.json write (handoff.returned + status), and that side instructs it in its skill
- [x] #2 Handoff artifact doctrine is .handoff/-only and internally consistent across lesson SKILL, planted template, and dod.mjs artifact derivation
- [x] #3 handoff-protocol doc references resolve from an installed plugin context
- [x] #4 A delegated-build round trip (educate hands off, build returns, gate passes at built) is covered by a test or scripted fixture
- [x] #5 Spec phase: Spec
- [x] #6 Spec phase: Implement
- [x] #7 Spec phase: Prove
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Spec 026-handoff-seam-ownership (hand-authored spec/plan/tasks on branch task-63-handoff-seam-ownership) drives; works on post-TASK-62 educate text. 1. Pick and instruct exactly one owner of the progress.json write (handoff.returned + status) at the seam, bounded by build's skill-only-by-design doctrine. 2. Make handoff artifact doctrine .handoff/-only and internally consistent across lesson SKILL, planted template, and dod.mjs derivation. 3. Make handoff-protocol references resolve from an installed plugin context. 4. Delegated-build round-trip covered by test/fixture. 5. Versions + wiki re-ground (educate-plugin, build-plugin, handoff-protocol notes). See specs/026-handoff-seam-ownership/plan.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Origin: downstream bug-find sweep run FROM promptworld (2026-07-27) against praxis decaa14 (v0.27.0, immediately post-TASK-57) — three parallel read-only finder agents (lib/scripts, core plugins, leaf plugins). Reported upstream because the TASK-57 cycle report was pasted into a promptworld session; the promptworld-side sibling gap is carded there as TASK-162. Items marked (live) were reproduced with live runs; the rest verified by reading code at decaa14.

Sweep dispatch (downstream-bugfix runbook, Lane D second, after TASK-62 merged — shared educate/gates/dod.mjs + templates/CLAUDE.md): tier = default implementer — seam-ownership + doctrine consistency, judgment bounded by AC#1's 'exactly one side'. Checkpoint: escalate only if the chosen owner would need machinery contradicting build's skill-only-by-design doctrine.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Handoff seam given an owner and one story (branch task-63-handoff-seam-ownership; PR pending merge). R1 DECISION: educate owns the progress.json write — the lesson skill's return leg, on finding the pending kind:response, records handoff.returned=true + status built BEFORE folding findings in; build's implement skill states explicitly its .handoff/ response is its entire return and it never writes the producer's ledger. Rationale (recorded in spec 026): the protocol already rules evidence is the consumer's to record in its own tracked state; build is generic ("or any producer") and an educate-schema write would couple it; matches build's non-goals and the enforcement-lives-educate-side precedent; text-only, no machinery — no escalation. R2: .handoff/-only doctrine everywhere — loose HANDOFF.md/POST_BUILD_HANDOFF.md gone from the lesson lifecycle, planted template, dod.mjs ARTIFACT_FILES derivation, and progress.schema.json. R3: docs/handoff-protocol.md gained praxisflux:handoff-protocol markers; stamped copy ships at lib/handoff-protocol.md via every plugin's lib symlink, with a SYNCS entry so the drift test covers it — refs resolve at install time. R4: round-trip test where each leg does exactly what its skill instructs; asserts the gate still blocks at built when the owner's write is skipped. Versions: lesson 0.2.0, implement 0.2.0, marketplace 0.35.0. Reconciled with post-65/59/64/60 main by merge-in (5a8e18d); honest pin classification; sync-shared --check green. Gates green at HEAD: node --test 231/231, check-docs, wiki freshness 30 notes, bump gate 0.34.0 → 0.35.0. Follow-up flagged for operator (not carded): sync-version.mjs stamps any argv verbatim (even --help) — needs argument validation.
<!-- SECTION:FINAL_SUMMARY:END -->
