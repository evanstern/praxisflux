# 014-reorient-worktree-first — refuse shared-primary-checkout runs without explicit override

Board: TASK-56 · Sweep: `docs/design/lane-hardening-runbook.md` (Lane 1) ·
Direction: TASK-52's follow-on doctrine (the board description carries the full
rationale — read it first; it governs).

## Requirements (map 1:1 to board ACs)

R1 (AC #1) — `reorient/scripts/run.mjs begin` refuses to open a run whose registry root
is a shared primary checkout, detected deterministically: `.git` is a DIRECTORY at the
registry root (in a worktree it is a `gitdir:` FILE). The refusal message names the
worktree recipe (`git worktree add .worktrees/<name> -b <branch>`) and the override.
Override: `--shared-checkout` flag (required by the AC); a project-level marker is
optional additive if the code structure makes it cheap — record the choice either way.
Tests cover: primary-checkout refusal, worktree (.git file) acceptance, override
acceptance, non-git roots (whatever today's behavior is stays).

R2 (AC #2) — the override is recorded on the run manifest and surfaced by
`list`/owner-provenance output (TASK-52's describeOwner lineage), covered by tests.

R3 (AC #3) — `reorient/skills/reorient/SKILL.md` states worktree-first as the default
doctrine and names the override path.

R4 (AC #4) — versions: reorient SKILL.md `version:` bump + marketplace
`scripts/sync-version.mjs 0.23.0` (0.22.0 released; sibling-collision re-bump is the
orchestrator's). Wiki: re-verify + re-pin `docs/wiki/reorient-plugin.md` (mind its
budgets — TASK-52 left it near the 8,000 cap) + lockstep stales; CAPSULES regen if any
description changes. No course (per-feature policy).

## Non-goals

Changing ownership semantics TASK-52 shipped; touching other plugins.
