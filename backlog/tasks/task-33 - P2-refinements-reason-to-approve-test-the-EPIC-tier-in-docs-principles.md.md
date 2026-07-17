---
id: TASK-33
title: 'P2 refinements: reason-to-approve test + the EPIC tier in docs/principles.md'
status: To Do
assignee: []
created_date: '2026-07-17 14:36'
labels: []
dependencies: []
priority: medium
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up to TASK-32 (merged as PR #47): two owner refinements were ratified in the Coda session while TASK-32 was mid-flight and are recorded in TASK-32's implementation notes, but docs/principles.md P2 does not yet carry them. Fold into the canonical statement:

(1) Reason-to-approve test: a PR exists only where it carries a stated reason for a human to approve — a policy being ratified, a posture changed, a contract made binding; never a diff for its own sake. Work items too small to give a reviewer a real decision are merged into the deliverable they serve rather than carded as their own TASK/PR.

(2) The EPIC tier, completing the three-tier model: an EPIC groups deliverable TASKs and gets no PR of its own; a TASK is a deliverable, exactly one PR; a SUBTASK is internal breakdown, never a PR.

Worked example + downstream restatement already exist: Coda's TASK-0003 epic restructure (7 deliverable TASKs, two reason-to-approve merges: .06→.04, .10→.08) and Coda's drafted v1.4.0 Principle V clarification (kofile/coda specs/009-taint-architecture/contracts/constitution-amendment.md, PR #9) — which references docs/principles.md as upstream, so upstream must actually state the rule.

Reason to approve (the human decision this PR carries): ratifying an amendment to canonical methodology text that every pdlc-bootstrapped project inherits.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 P2 in docs/principles.md states the reason-to-approve test as part of the TASK definition
- [ ] #2 P2 states the three-tier model (EPIC groups / TASK = 1 PR / SUBTASK never a PR), task-system-agnostically
- [ ] #3 The pdlc bootstrap grounding block reflects the refinements if it restates P2
- [ ] #4 Wiki notes sourcing docs/principles.md re-pinned
<!-- AC:END -->
