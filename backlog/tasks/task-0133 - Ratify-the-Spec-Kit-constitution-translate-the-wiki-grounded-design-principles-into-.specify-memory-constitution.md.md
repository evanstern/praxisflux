---
id: TASK-0133
title: >-
  Ratify the Spec Kit constitution: translate the wiki-grounded design
  principles into .specify/memory/constitution.md
status: To Do
assignee: []
created_date: '2026-09-11 18:01'
updated_date: '2026-09-11 18:47'
labels:
  - pdlc
  - tooling
dependencies: []
priority: medium
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-0128 (operator-approved at sweep close, 2026-09-11): the constitution was deliberately left unratified — .specify/memory/constitution.md records the absence, and planning runs against docs/wiki/ + CLAUDE.md in the meantime.

Operator direction: the design is well described in the wikis; translate it into the constitution. The work is a translation pass, not new design — read the grounded corpus (docs/wiki/, capsule-first) and CLAUDE.md's always-on rules, and draft constitution articles from what they already establish (the 101 principles, gates posture, one-task-one-PR, model tiers, worktree discipline, grounding freshness). The actual item list requires an operator discussion before drafting — the operator picks which principles are constitutional vs. merely doctrinal.

Not sweepable as-is: starts with an operator conversation (pdlc:design-rounds shape or a triage session), then the agreed items become the spec.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Operator discussion held: the item list for the constitution is agreed and recorded (decision artifact, not chat)
- [ ] #2 Constitution drafted from the agreed items, each article traceable to its wiki/CLAUDE.md source
- [ ] #3 Constitution ratified: .specify/memory/constitution.md carries the ratified text; the unratified record is retired
- [ ] #4 Spec Kit plan template's constitution-check step verified against the ratified text on a real spec
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision record committed: docs/design/constitution-decision.md (3b411a3) — 7 articles (A1-A6, A8) + amendment article; A7 out (model-tiers.json stays sole source of truth); Tier B/C all doctrine; preamble references docs/principles.md as upstream. Drafting dispatches next (sonnet — the decision record settles all judgment calls).
<!-- SECTION:NOTES:END -->
