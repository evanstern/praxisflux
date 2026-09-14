---
id: TASK-97
title: >-
  pdlc:sweep — doctrine the agent-def dispatch mechanism (model pinning via
  .claude/agents + served-model verification)
status: Done
assignee: []
created_date: '2026-08-01 14:22'
updated_date: '2026-09-14 13:41'
labels:
  - debt
  - pdlc-sweep
dependencies: []
priority: medium
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-18-47-56, findings 1+2 (report: docs/reviews/team-review-praxis-2026-07-31-18-47-56.md; triage record: docs/reviews/refactor-triage-praxis-2026-07-31-18-47-56.md).

Evidence: pdlc/skills/sweep/SKILL.md:197-198 still teaches dispatch-time pinning via the Agent tool's model param — the mechanism the board-cost-test sweep falsified (silently ignored, enum-rejects explicit IDs; docs/design/board-cost-test-runbook.md:301-308, $1.41 discovery cost). The working mechanism — committed .claude/agents/{opus,sonnet}-implementer.md defs with model: frontmatter, served model verified from the transcript before siblings launch — is runbook-local. .claude/agents/opus-implementer.md:4 hard-pins the FALLBACK claude-opus-4-8 with a description misattributing it to the never-inherit ruling; nothing points back at the claude-opus-5 primary. docs/wiki/pdlc-sweep.md:71-73 mirrors the stale doctrine. Same shape as accepted F4 in refactor-triage-praxis-2026-07-31-11-12-22.md — re-created one generation later.

Renumbered from TASK-91 (created 2026-07-31 20:03) on 2026-08-01: TASK-91 was taken on main by an unrelated card before this triage PR merged. Content is verbatim from the original.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SKILL Phase 1 item 2 + step 5 teach agent-def pinning (committed def with model: frontmatter) and served-model verification from the transcript before sibling dispatches launch, with the dispatch-call param path demoted to hosts where it verifiably works
- [ ] #2 opus-implementer.md (and sonnet sibling if touched) states primary-vs-fallback provenance (claude-opus-5 primary; claude-opus-4-8 subscription fallback, operator ruling 2026-07-31) and the condition for re-preferring the primary
- [ ] #3 docs/wiki/pdlc-sweep.md amended (NEEDS-REVIEW, not stamp-only) in the same PR
- [ ] #4 sweep skill version bump + marketplace lockstep
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CLOSED AS SUPERSEDED (operator ratification, 2026-09-14, pre-sweep board prune).

Verified against HEAD 3c696f1 — the card's premise no longer describes the tree:

AC#1: pdlc/skills/sweep/SKILL.md:225-242 now teaches exactly what this card asked for. Step 5 dispatches "by naming that tier's generated agent definition (.claude/agents/<tier>-implementer.md), whose frontmatter model: is what this harness actually honors", demotes the dispatch-call param to hosts where it verifiably works ('assume neither mechanism works until you have seen it work here'), and makes served-model transcript verification the load-bearing step before sibling dispatches launch. The stale lines 197-198 this card cited are gone.

AC#2: .claude/agents/opus-implementer.md:3 and :12 state the primary/fallback provenance — 'Sweep implementer pinned to cc/claude-opus-5[1m]' with 'Fallback when cc/claude-opus-5[1m] is unavailable: cc/claude-opus-4-8[1m] (record which model actually served)'. The misattribution to the never-inherit ruling is gone.

AC#3: docs/wiki/pdlc-sweep.md carries no stale dispatch-mechanism prose to amend (no agent-def/served-model/tier references remain in a form this card would correct).

Mechanism: TASK-106 (config-driven model tiers) rebuilt this surface wholesale — .claude/model-tiers.json is now the declaration and pdlc/scripts/tiers.mjs generates the agent defs, which is a strictly stronger answer than the prose fix this card scoped. TASK-107 verified the host-form pins actually serve. No residual work; closing rather than re-scoping.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Superseded by TASK-106/107 (config-driven model tiers). All three doctrine ACs are satisfied in the current tree by a stronger mechanism than this card scoped: sweep SKILL.md:225-242 teaches agent-def frontmatter pinning plus served-model transcript verification, .claude/agents/opus-implementer.md carries primary/fallback provenance, and the wiki mirror has no stale dispatch prose left. Closed without a PR — no tree change was needed. Verified against HEAD 3c696f1.
<!-- SECTION:FINAL_SUMMARY:END -->
