---
name: team-review-plugin
description: The team-review plugin — a lead-plus-subagent architecture review of a caller-supplied codebase, read-only by doctrine, proven by an output gate (report sections + resolving citations + target untouched) and a Stop hook over in-flight run records.
kind: component
sources:
  - team-review/.claude-plugin/plugin.json
  - team-review/README.md
  - team-review/skills/team-review/SKILL.md
  - team-review/gates/review.mjs
  - team-review/hooks/hooks.json
  - team-review/scripts/gate.sh
  - team-review/scripts/stop.mjs
  - team-review/scripts/run.mjs
  - team-review/scripts/orient.mjs
verified_against: a7b544fe6226f7f7cc2b7cbe8b68abd184283982
---

# team-review plugin

The `team-review` plugin (lockstep with the marketplace version; skill at its own
`version: 1.3.0`) runs a **lead-engineer-plus-team architecture review** of any codebase:
the lead orients, fans out specialist subagents in parallel (seniors for depth, scouts for
breadth, team sized by the target's non-test line count), spot-checks their claims, and
synthesizes one consolidated, evidence-backed report. The engagement is **read-only by
doctrine** — the reviewed repo must come out byte-for-byte untouched, verified against a git
snapshot taken when the run opened.

It is the suite's first **caller-supplied target** plugin (the third placement model in
[[skill-patterns]]): it operates on a root the caller names but stores all state at the
*invoking* project's root — run records ride the gitignored `.handoff/team-review/runs/`
transport there, and nothing (no hook, no CLAUDE.md) is ever installed into the target.
Self-review (invoking root == target) is sanctioned: the records — and the default report —
then land inside the target's `.handoff/` transport, and the gate treats that residue as
transport, never as mutation. **The residue rule (TASK-70, operator-decided):** a review
report is evidence and lives in tracked state; the transport is transient plumbing — so a
pure-defaults self-review copies the proven report to tracked
`docs/reviews/team-review-<run-id>.md` in the target on `finish` (run records stay on the
transport). It deliberately
ships **no lifecycle and no planted CLAUDE.md**; the gate is in-skill plus an invoking-side
Stop hook.

## How it works

**The run record is the evidence base.** `scripts/run.mjs` (the plugin's only writer) opens
a run with `begin <target> [--report <path>]`: it snapshots the target (`gitSnapshot` —
HEAD + `status --porcelain`; non-git targets degrade the untouched-check to advisory),
records target/report/cwd, and warns if the invoking root's `.gitignore` misses `.handoff/`
(escalated to a prominent multi-line WARN — never a hard fail — when the invoking root IS
the target, since the records then land inside the repo under review).
`finish` runs the output gate and marks the run `done` only on pass; `abandon <id> <reason>`
closes with durable residue; ids are `<target-basename>-<timestamp>` with a collision
suffix so a record is never overwritten. The default report path is
`reports/team-review-<run-id>.md` beside the runs registry (`reportsDirFor`) — run-id-keyed
so two same-day runs of one target never collide on one report path (reorient's prior art),
and never bare cwd, so a self-review's default can't land on the target's own content.
On a pure-defaults self-review (runs home root == target, no `--report`), `begin` records a
`trackedReport` destination — `docs/reviews/team-review-<run-id>.md` in the target — names it
in its output and the WARN, and `finish` copies the proven report there strictly AFTER the
output gate passes, so the untouched-target check never sees the copy (the TASK-61 deadlock
fix holds); the run record then names both paths. Explicit `--report` always wins: no copy.
`$TEAM_REVIEW_HOME` overrides both the runs dir and the reports dir (tests).

**The output gate never writes.** `gates/review.mjs` exports the pure pieces
(`runsDirFor`, `reportsDirFor`, `gitSnapshot`, `citations`, `checkReview`) and checks three
things: the
report has all required sections (TL;DR, What we like, What could be improved, What should
be removed, Stealing for later, Questions), at least 5 backticked file citations resolve to
real files in the target (tolerating a repeated repo-basename prefix), and the target's git
snapshot is unchanged since `begin` — with `.handoff/` entries stripped from both sides of
the porcelain comparison (`stripHandoffEntries`), so the plugin's own run records never trip
the read-only check on a self-review. A report written *inside* the target is rejected —
except under the target's `.handoff/` transport, the same exemption as the porcelain strip
(and where the default lands when the runs home root IS the target, i.e. self-review).

**Stop-hook enforcement.** `reviewGate` speaks the `@praxisflux/gates` contract: its
`resolveRoots(startDir)` returns the in-flight run records under `runsDirFor(startDir)`
scoped to the session's project dir (no runs in scope = no-op), and `check` maps
`checkReview` problems per run, appending finish/abandon guidance. `scripts/stop.mjs` is a
thin `runStopHook({ gates: [reviewGate] })` entry wired through the standard `gate.sh` shim
(`hooks/hooks.json`; node missing = one-time stderr notice, then exit 0) — an in-flight
review can't be silently walked away from.

**The skill** (`skills/team-review/SKILL.md`) follows the gate→work→gate shape: precondition
gate (confirm a whole-repo ask, capture the review *lens* — the user's stated goal — and
`run.mjs begin`), Phase 1 lead orientation (`scripts/orient.mjs` prints layout/line-weight/
test-weight/recent-commits facts; the lead also reads load-bearing files itself), Phase 2
fan-out (one message, persona + beat + lens + report structure + word caps per agent; a
no-subagent `claude -p` fallback; dispatch mode matched to whether the lead is itself a
subagent), Phase 3 relay and spot-check (stalled agents cost a section, never the
engagement), Phase 4 synthesis to the run's report path, then the output gate via
`run.mjs finish`. Every script has a stated inline fallback so the skill works hand-copied.

## Connections

- The third placement model in [[skill-patterns]]; the rooting rule (state at the invoking
  root only) is what keeps [[handoff-protocol]]-style transport writes legal.
- The gate rides [[gate-runner]] and the run-as-CLI guard from [[chassis-utilities]];
  packaged by [[build-and-release]], registered by its generative `gen-marketplace.mjs`.
- Instantiates the [[gates-convention]] per run rather than per project state — the reason
  it exports no repo-consumable CI gate.
- Covered by the [[test-suite]] (`test/team-review.test.mjs`).
- Provenance: developed and eval-hardened standalone, then transplanted; its own review of
  this repo is vendored as spec input at `docs/design-inputs/team-review-iteration-3-review.md`.

## Operational notes

- Run lifecycle CLI: `node ${CLAUDE_PLUGIN_ROOT}/scripts/run.mjs
  begin <target> [--report <path>] | finish <id|target> | abandon <id|target> [reason] | list`.
- Gate CLI (read-only): `node ${CLAUDE_PLUGIN_ROOT}/gates/review.mjs <run.json>` — exit 0
  pass, 2 with problems on stderr.
- The default report path is `.handoff/team-review/reports/team-review-<run-id>.md` under
  the runs home, never on the target's content; `checkReview` enforces the
  outside-the-target rule (with only the `.handoff/` transport exempt) even when a caller
  overrides the path with `--report`.
- Self-review on pure defaults ends with TWO copies of the report: the transport one the
  gate verified, and the tracked one at `docs/reviews/team-review-<run-id>.md` for the
  operator to commit — evidence lives in tracked state.
