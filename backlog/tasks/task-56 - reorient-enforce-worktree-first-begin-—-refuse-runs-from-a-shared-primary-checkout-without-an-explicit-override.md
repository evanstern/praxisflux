---
id: TASK-56
title: >-
  reorient: enforce worktree-first begin — refuse runs from a shared primary
  checkout without an explicit override
status: To Do
assignee: []
created_date: '2026-07-26 18:11'
labels:
  - reorient
  - gates
  - design
dependencies:
  - TASK-52
ordinal: 91000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-on to TASK-52 (session-owned runs, PR #74). The worktree doctrine — begin reorient runs from inside a git worktree so the gitignored .handoff/ registry stays lane-local — is currently untraceable prose: it lived only in TASK-52's description, was never planted in SKILL.md, and nothing in run.mjs or the gate checks where a run is begun. Ownership scoping (TASK-52) is defense-in-depth, not a replacement: the registry in a shared primary checkout is still shared mutable state, and with no session identity available the gate degrades to checkout-wide nagging. Observed live: TASK-52 itself was implemented from the praxis primary checkout while two other sessions were mid-flight in it. Make the default enforceable and the exception explicit: begin detects a shared primary checkout deterministically (.git is a directory at the registry root; in a worktree it is a gitdir: file) and refuses by default with an actionable message naming the worktree recipe; an explicit override (--shared-checkout flag and/or a project-level marker) permits it, is recorded on the run manifest, and is surfaced by list/describeOwner so the deliberate choice is auditable. SKILL.md states worktree-first as the default doctrine and names the override. Same family as TASK-55 and promptworld TASK-148: cross-session state needs origin-visible, enforced posture — not judgment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 run.mjs begin refuses to open a run whose registry root is a shared primary checkout (.git directory) unless an explicit override is given; the refusal names the worktree recipe and the override; covered by tests including the worktree (.git file) case
- [ ] #2 The override is recorded on the run manifest and surfaced by list/provenance output, covered by tests
- [ ] #3 SKILL.md documents worktree-first as the default doctrine and the explicit override path
- [ ] #4 Versions bumped per docs/releasing.md (reorient released surface; skill version bump)
<!-- AC:END -->
