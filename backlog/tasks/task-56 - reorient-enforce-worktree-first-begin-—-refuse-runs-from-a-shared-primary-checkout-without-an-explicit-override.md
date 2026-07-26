---
id: TASK-56
title: >-
  reorient: enforce worktree-first begin — refuse runs from a shared primary
  checkout without an explicit override
status: In Progress
assignee:
  - '@claude'
created_date: '2026-07-26 18:11'
updated_date: '2026-07-26 19:56'
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

Spec: specs/014-reorient-worktree-first
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 run.mjs begin refuses to open a run whose registry root is a shared primary checkout (.git directory) unless an explicit override is given; the refusal names the worktree recipe and the override; covered by tests including the worktree (.git file) case
- [ ] #2 The override is recorded on the run manifest and surfaced by list/provenance output, covered by tests
- [ ] #3 SKILL.md documents worktree-first as the default doctrine and the explicit override path
- [ ] #4 Versions bumped per docs/releasing.md (reorient released surface; skill version bump)
- [ ] #5 Spec phase: Spec
- [ ] #6 Spec phase: Implement
- [ ] #7 Spec phase: Prove
<!-- AC:END -->



## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec 014-reorient-worktree-first (hand-authored)
2. spec-bridge:link
3. Dispatch: run.mjs begin refuses shared-primary-checkout registry roots (.git dir vs gitdir: file detection) unless --shared-checkout (and/or project marker) given; override recorded on manifest, surfaced by list/provenance; SKILL.md states worktree-first doctrine + override; tests incl. worktree case
4. Versions (reorient skill + marketplace); wiki re-pin reorient-plugin; PR; serial merge
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sweep Lane 1 (docs/design/lane-hardening-runbook.md). Tier: default implementer. Follow-on to TASK-52 (0.22.0).
<!-- SECTION:NOTES:END -->
