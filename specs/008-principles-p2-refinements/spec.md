# 008-principles-p2-refinements — reason-to-approve test + the EPIC tier into P2

Board: TASK-33 · Sweep: `docs/design/board-clearing-runbook.md` (Lane 1) ·
Direction: TASK-32's ratified owner refinements (recorded in TASK-32 implementation
notes; worked example: Coda TASK-0003 restructure + Coda constitution-amendment PR #9,
which cites docs/principles.md as upstream — so upstream must actually state the rule).

## Problem

docs/principles.md P2 doesn't yet carry two refinements ratified while TASK-32 was
mid-flight: the reason-to-approve test, and the EPIC tier completing the three-tier
model. Downstream (Coda) already references the upstream statement that doesn't exist.

## Requirements

### R1 — reason-to-approve test in P2 (AC #1)

Canonical statement, in P2's existing voice: a PR exists only where it carries a stated
reason for a human to approve — a policy ratified, a posture changed, a contract made
binding; never a diff for its own sake. Work items too small to give a reviewer a real
decision are merged into the deliverable they serve rather than carded as their own
TASK/PR.

### R2 — the three-tier model, task-system-agnostic (AC #2)

An EPIC groups deliverable TASKs and gets no PR of its own; a TASK is a deliverable,
exactly one PR; a SUBTASK is internal breakdown, never a PR. Word it without naming any
specific task system (Backlog.md/Jira are examples at most), per P1/P2's
reference-and-apply contract (canonical here; consumers reference and apply).

### R3 — pdlc grounding sync (AC #3)

The pdlc bootstrap template's stamped principles region must match the canonical text
where it restates P2 — a repo test asserts the template carries the principles. Check
`pdlc/templates/CLAUDE.md` (and `scripts/sync-shared.mjs` conventions if the region is
stamped): update the stamped restatement if it quotes the refined P2 language; if it
only summarizes at a level the refinements don't reach, record that finding instead of
editing. Template edits are released surface → bump `pdlc:bootstrap` skill version +
marketplace via `scripts/sync-version.mjs 0.16.0` (sibling-collision re-bump is the
orchestrator's).

### R4 — grounding (AC #4)

Re-verify + re-pin every wiki note whose `sources:` include docs/principles.md or the
touched template (expect `skill-patterns` and/or `pdlc-plugin`; trust the freshness
gate's output over this guess). Two-step pins; capsule/body budgets hold; regenerate
`docs/wiki/CAPSULES.md` if any description changes.

### R5 — course policy

Whatever docs/task-courses.md says at merge time; the orchestrator calls it (TASK-41 is
in flight in this same lane).

## Non-goals

P3 (artifact-gated seams) is TASK-34 — do not add it. No other principles change.

## Acceptance

Board ACs #1–#4 map to R1–R4.
