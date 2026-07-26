---
id: TASK-40
title: >-
  Enforcement honesty sweep: advisory-by-design gates, README truth, per-plugin
  enforcement surface
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-23 17:26'
updated_date: '2026-07-26 15:17'
labels: []
dependencies: []
references:
  - >-
    backlog/docs/reviews/doc-1 -
    Team-review-2026-07-23-—-praxisflux-vs-its-own-tenets.md
priority: medium
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Owner decision (2026-07-23, team-review follow-up): local Stop gates stay advisory/opt-in by design. Reframe the docs to the tenet actually delivered — gates make dishonest status expensive locally and impossible in CI — and make the enforcement surface explicit per plugin (four plugins wire Stop hooks; grounding-wiki and codebase-to-course ship CLI/CI-only gates, and the README currently reads as if enforcement arrives on install). Also fix countable README drift the review found: the intro says seven plugins and omits team-review while the table and install list have eight.

Spec: specs/012-enforcement-honesty
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README/CLAUDE.md/docs/consuming-gates.md framing states plainly that local Stop gates are advisory and CI is authoritative
- [ ] #2 README plugin table gains an enforcement column (Stop-hook enforced vs CLI/CI gate) matching each plugin's actual hooks/ wiring
- [ ] #3 gate.sh emits a one-time non-blocking stderr notice when node is missing instead of a fully silent exit 0
- [ ] #4 README plugin count/enumeration is checked mechanically against marketplace.json in check-docs (replacing or supplementing the backtick census), and the seven-vs-eight drift is fixed
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 012-enforcement-honesty (hand-authored)
2. spec-bridge:link
3. Dispatch: reframe README/CLAUDE/consuming-gates to the delivered tenet (local Stop gates advisory, CI authoritative — dishonest status expensive locally, impossible in CI); README plugin table gains an enforcement column matching actual hooks/ wiring; gate.sh one-time stderr notice when node missing; check-docs gains mechanical README-count-vs-marketplace census; fix seven-vs-eight (now nine) drift incl. the stale status blockquote TASK-37 left
4. Versions (scripts/ + plugin gate.sh = released surface -> 0.20.0); wiki re-pins; PR; merge
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 3 (docs/design/board-clearing-runbook.md), after TASK-37 by design (README-touchers merge last; the final story is now in place). Tier: default implementer (docs reframe + two small code legs).
<!-- SECTION:NOTES:END -->
