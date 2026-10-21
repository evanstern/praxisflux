---
name: pdlc-pr-review-sweep
description: The pdlc:pr-review-sweep skill — works a GitHub pull-request review end to end: read the review and child comments, triage each (fix, pass-not-valid, pass-covered, defer, already-resolved), card fixes and deferrals on the board, run pdlc:sweep over the fixes under the host's standing orders, then reply on each thread; resolves the PR head branch (merged PRs via the PR ref), treats a deferral as a board task not a PR, gates replies as outward-facing.
kind: component
sources:
  - pdlc/skills/pr-review-sweep/SKILL.md
verified_against: 3f589f8ae10daad8307d2851e68bd844e5b0e234
---

# pdlc:pr-review-sweep — review comments to triage, tasks, sweep, replies

`skills/pr-review-sweep/SKILL.md` — the fifth skill of the [[pdlc-plugin]], added in 0.68.0
(TASK-0145, spec 074) — owns the seam where **review feedback** enters the lifecycle. Its
neighbors cover the other seams: [[pdlc-sweep]] executes a set of tasks,
[[pdlc-refactor-triage]] evaluates merged work, [[pdlc-design-rounds]] precedes the spec.

## The loop

**read → triage → card → sweep → reply**, leaving an artifact at each step: a tracked
triage record (`docs/reviews/pr-<N>-review-<review-id>-triage.md`), board tasks citing their
comment ids, and the replies themselves.

Triage assigns one disposition per comment: **fix**, **pass — not valid**, **pass — covered**
(an epic or ticket already names the defect), **defer** (real, not a blocker, its own task),
or **already resolved** (a reply and a fix already exist on the current base; if every
comment lands here the round is done and the skill stops rather than inventing tasks). Every
pass cites checkable evidence.

## Rules the phases encode

- **Find the code first.** The starting checkout is often not the PR head; the skill resolves
  `headRefName` / `headRefOid` and cuts fixes from the head branch for an open PR. For a
  merged or squash-merged PR the review's commit is only reachable through `pull/<N>/head`,
  so it reads there and cuts fixes from the default branch's tip.
- **Host standing orders override sweep defaults.** Rules like no PRs or push one branch go
  into the `pdlc:sweep` invocation and the runbook's first lines.
- **Spec Kit may be root-local.** `.specify/` and `specs/` are often git-excluded, so a fresh
  worktree lacks them; the check reads the repository root, and genuine absence is a stop
  with the sweep's two real options, never an inline decision.
- **"Create the PR" for a deferral means a board task** unless the host's flow plainly wants
  a PR and the user confirmed; the report states which reading was used.
- **Replies are outward-facing.** They wait for the operator's go-ahead and for the fix to be
  reachable (a squash merge or an unpushed branch makes quoted SHAs dead links); deferral
  replies must link something the reviewer can open, since a local board is invisible to them.
- **Sibling sweep.** A pattern defect is grepped across the codebase before carding.

## Provenance

v0.2.0 came out of a skill-creator pass: read-only dry runs against an open PR and a merged
PR, whose agent-reported gaps drove the merged-PR, already-resolved, id-numbering, tracker
fallback and base-branch edits, plus a 20-query trigger check on the description.
