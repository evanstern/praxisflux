---
id: TASK-92
title: >-
  pdlc:sweep — background-job mode stitching (Output-gate back-pointer,
  author-mode hatch clause, execution-mode runbook line)
status: To Do
assignee: []
created_date: '2026-07-31 20:04'
labels:
  - debt
  - pdlc-sweep
dependencies:
  - TASK-91
priority: medium
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: refactor-triage run praxis-2026-07-31-18-47-56, findings 4+5+6 (report: docs/reviews/team-review-praxis-2026-07-31-18-47-56.md; triage record: docs/reviews/refactor-triage-praxis-2026-07-31-18-47-56.md).

Evidence: (4) the background-job mode names the Output gate as its third touchpoint (pdlc/skills/sweep/SKILL.md:356-358) but the gate (:378-391) carries no mode parenthetical — unlike steps 2/9/10 — and nothing states its checks are only satisfiable after the wrap-up PR merges. (5) the hand-authored-specs hatch (:38-41) requires the runbook to record the escape line, but the precondition gate runs before Phase 1 authors any runbook — author-mode on a .specify/-less host is temporally impossible, failing the resume-from-artifacts contract (:13-15). (6) no artifact records WHICH execution mode a sweep runs under; a resuming session with main-push rights inherits riding-the-next-branch closures with no explanation — add an 'Execution mode:' line to the template state snapshot (pdlc/skills/sweep/templates/runbook.md:21-28). Incidental: rewrap the unwrapped mode parentheticals (SKILL.md:149-153, :252).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Output gate carries the mode back-pointer incl. wrap-up-PR sequencing (gate re-checks run after it merges)
- [ ] #2 precondition hatch gains the author-mode clause (the runbook being authored must carry the line; lane sign-off covers it)
- [ ] #3 template state snapshot gains an 'Execution mode: interactive | background-job/no-main-push' line
- [ ] #4 mode parentheticals rewrapped to file convention
- [ ] #5 docs/wiki/pdlc-sweep.md re-verified; sweep skill version bump + lockstep
<!-- AC:END -->
