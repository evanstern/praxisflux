---
id: TASK-91
title: >-
  pdlc:sweep — doctrine the agent-def dispatch mechanism (model pinning via
  .claude/agents + served-model verification)
status: To Do
assignee: []
created_date: '2026-07-31 20:03'
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
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SKILL Phase 1 item 2 + step 5 teach agent-def pinning (committed def with model: frontmatter) and served-model verification from the transcript before sibling dispatches launch, with the dispatch-call param path demoted to hosts where it verifiably works
- [ ] #2 opus-implementer.md (and sonnet sibling if touched) states primary-vs-fallback provenance (claude-opus-5 primary; claude-opus-4-8 subscription fallback, operator ruling 2026-07-31) and the condition for re-preferring the primary
- [ ] #3 docs/wiki/pdlc-sweep.md amended (NEEDS-REVIEW, not stamp-only) in the same PR
- [ ] #4 sweep skill version bump + marketplace lockstep
<!-- AC:END -->
