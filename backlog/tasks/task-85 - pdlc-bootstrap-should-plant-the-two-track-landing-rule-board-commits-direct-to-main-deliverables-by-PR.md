---
id: TASK-85
title: >-
  pdlc:bootstrap should plant the two-track landing rule: board commits direct
  to main, deliverables by PR
status: To Do
assignee: []
created_date: '2026-07-28 15:06'
updated_date: '2026-07-31 17:40'
labels:
  - debt
dependencies: []
priority: medium
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: surfaced while sweeping infinitynode.media (a PDLC-bootstrapped host) on 2026-07-28. praxisflux itself follows a clear two-track convention — board/bookkeeping commits go DIRECT to main, deliverable work goes by PR — but pdlc:bootstrap never plants it, so hosts have to rediscover or invent it.

Evidence:
- pdlc/templates/CLAUDE.md, the pdlc:peer:backlog block, states "One task, one PR: a top-level TASK gets one branch and one PR" and says nothing at all about how board commits land. A host reads that as "everything reaches main by PR".
- praxisflux's own history contradicts that reading and is right to: c740315 "board: card TASK-80 ...", 517dd00 "refactor-triage run ...: TASK-81..83 carded", 6e55e17 "TASK-73: sweep-close — board Done via spec-bridge:sync" all land direct on main, while deliverable work goes through PRs (e.g. #98).
- Downstream cost, observed: infinitynode.media's docs/wiki/overview.md:86 asserts "work reaches main by PR, never by direct push", while all five of its focus-board bookkeeping commits went direct. Its team review flagged this as drift (finding F18/F19), a debt task was carded for it (that repo's TASK-12 AC#6, "a stated rule covers whether board-bookkeeping commits may go direct to main"), and the operator ultimately resolved it by adopting praxisflux's convention verbatim. That is a full triage cycle spent rediscovering a rule the suite already follows.

The bootstrap block is the right home because it is the always-on grounding: it is what makes the rule apply when no skill has triggered, and it is refreshed wholesale on plugin update, so hosts stay in sync.

Note the interaction with the one-task-one-PR principle (TASK-32 encoded TASK<->PR granularity as foundational): the two-track rule does not weaken it. A board card is not a deliverable and carries no reviewable decision — the planted CLAUDE.md already says a PR "exists only where it carries a stated reason for a human to approve ... never a diff for its own sake". Making board commits direct is that principle applied, not an exception to it. The wording should say so, so the two rules are not read as being in tension.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pdlc/templates/CLAUDE.md's pdlc:peer:backlog block states the two-track landing rule: board/bookkeeping commits (cards, status flips, notes, AC ticks) direct to main; deliverable work by PR
- [ ] #2 The wording derives the rule from the existing no-PR-for-its-own-sake principle so it does not read as an exception to one-task-one-PR
- [ ] #3 pdlc:bootstrap's update path refreshes the block on already-bootstrapped hosts
- [ ] #4 pdlc:sweep's doctrine references the rule rather than restating it, so sweeps stop having to ratify it per-host
- [ ] #5 plugin version bump + marketplace bump; pdlc wiki note re-verified; gates green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-31 (TASK-90): pdlc:sweep SKILL.md now names a background-job / no-main-push execution mode. When 85 plants the two-track landing rule (board/bookkeeping commits direct to main; deliverables by PR), note that in that mode the board track's 'direct to main' degrades to rides-the-next-branch / wrap-up PR. Keep the wordings reconciled; the mode section already cross-references TASK-85.
<!-- SECTION:NOTES:END -->
