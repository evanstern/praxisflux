# team-review

A lead-engineer-plus-team architecture review of any codebase: the lead orients, fans out
specialist subagents in parallel (seniors for depth, scouts for breadth), spot-checks their
claims, and synthesizes one consolidated, evidence-backed report — proven by a read-only
output gate.

The engagement is **read-only by doctrine**: the reviewed repo must come out byte-for-byte
untouched, and the gate verifies that against a git snapshot taken when the run opened.

## The third placement shape

team-review is the suite's first *caller-supplied target* plugin (`docs/skill-patterns.md` §6):
it operates on a root the caller names (the repo under review) but stores all state at the
**invoking** project's root — run records ride the gitignored `.handoff/team-review/runs/`
transport there, never inside the target. Nothing is ever installed into the target: no planted
CLAUDE.md, no target-side hook (either would themselves be the forbidden write). The gate is
in-skill, plus a Stop hook at the invoking side that refuses to end a turn while a run is
in flight without a proven report.

## Parts

- **team-review** (skill) — precondition gate (open the tracked run, capture the review lens) →
  orient, fan out, synthesize → output gate (`run.mjs finish`).
- **gates/review.mjs** — read-only verification: report sections present, ≥5 citations resolve
  to real files in the target, target untouched vs the begin snapshot. Exposes `reviewGate` on
  the `@praxisflux/gates` contract. Never writes.
- **scripts/run.mjs** — the only state writer: `begin | finish | abandon | list` over run
  records (`$TEAM_REVIEW_HOME` overrides the location for tests).
- **scripts/orient.mjs** — deterministic Phase 1 facts (layout, line weight, test weight,
  recent commits); read-only.
- **Stop hook** (`scripts/stop.mjs` on `lib/gate-runner.mjs`) — an in-flight run scoped to this
  project dir can't be silently walked away from: finish it or `abandon` it with residue. No-op
  when no run is in scope.

## Provenance

The skill was developed and eval-hardened standalone (three graded iterations, finishing 10/10
unshepherded), then transplanted here. Its own review of this repo — which specified the
transplant — is vendored as spec input at
[`docs/handoffs/team-review-iteration-3-review.md`](../docs/handoffs/team-review-iteration-3-review.md)
(process log alongside it).
