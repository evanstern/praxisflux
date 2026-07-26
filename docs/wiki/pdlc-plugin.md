---
name: pdlc-plugin
description: The pdlc plugin — the suite-level installer plus the lifecycle's orchestrator; bootstrap plants the always-on PDLC grounding as a marked CLAUDE.md block (deterministically, via scripts/plant.mjs), stamps the .pdlc sentinel, gitignores .handoff/, and opts a project into the supported peer utilities (Backlog.md, Spec Kit); sweep authors a dependency-laned, operator-signed-off runbook over a set of board tasks and executes them through spec → PR → merge → re-ground.
kind: component
sources:
  - pdlc/.claude-plugin/plugin.json
  - pdlc/README.md
  - pdlc/skills/bootstrap/SKILL.md
  - pdlc/skills/sweep/SKILL.md
  - pdlc/skills/sweep/templates/runbook.md
  - pdlc/scripts/plant.mjs
  - pdlc/templates/CLAUDE.md
verified_against: a4862009d6789e31b8ac0fa237feb1ac8f5819e0
---

# pdlc plugin

The `pdlc` plugin (lockstep with the marketplace version) is the **suite-level installer plus
the lifecycle's own orchestrator**: `pdlc:bootstrap` stamps a folder (new or existing
codebase) as a **praxis-development-lifecycle project** whose always-on context
knows the whole loop, the suite-wide application of the [[skill-patterns]] rule "plant a
project CLAUDE.md" (a plugin has no always-on slot); since 0.12.0 a second skill, `sweep`,
runs the lifecycle it installs (below).

## pdlc:sweep — the board-sweep orchestrator

`skills/sweep/SKILL.md` (with `skills/sweep/templates/runbook.md`) orchestrates a **set of
board tasks** into merged PRs. Two phases, gate → work → gate:

- **Author:** from task ids / a label / a synthesis doc, derive dependency-ordered **lanes**
  (the governing rule is *develop in parallel, merge serially*; contract-shaped work
  leads — a published interface unblocks consumers), per-task model
  tiers from the host rubric, the project's per-PR gates enumerated, concurrency doctrine
  with named hotspots, operator checkpoints, and a done-means — written to
  `docs/design/<slug>-runbook.md`, committed, then **stopped for operator sign-off** on the
  lanes.
- **Execute:** per task, the host PDLC loop instantiated — **claim before work** (the
  first commit claims the task — board card → In Progress plus the spec number's
  directory; push immediately, never force-push a claim; a
  rejected push means the race was lost: re-read the board/`specs/`, surface
  genuinely contended work to the operator, rebase-and-repush otherwise), Spec Kit
  cycle, `spec-bridge:link`, worktree, delegated implementation (never inline), per-PR
  gates, rebase, PR, serial merge with verify-merged-before-cleanup, re-ground, one
  execution-log line.

Since 0.12.1 both phases consume a host **merge-drift gate** when the precondition probe
finds one (`scripts/check-merge-drift.mjs`, the promptworld spec-051 pattern —
`session`/`worktree`/`pr` modes): `session` at sweep start subsumes the root fetch/ff-pull
and feeds its drift matrix into lane construction, `worktree [--spec NNN]` mechanizes the
fresh-root and spec-number checks, and `pr` blocks each
`gh pr create` (re-run after every rebase) on predicted conflicts. The runbook records the
probe result; with no gate the raw git doctrine stands. Since 0.13.0 the runbook template's
concurrency doctrine carries the fuller claim-before-work doctrine above and names the
gate's mechanical checks (`claim --dir NNN-slug` before creating any new `specs/NNN-*`
dir; `worktree --spec NNN --task TASK-<n>` when cutting the worktree).

Since 0.14.0 sweep's two whole-corpus orientation moments (runbook authoring's project
reading, each task's re-ground) consume the corpus per [[grounded-corpus-spec]] v2 —
`CAPSULES.md` when present, full note bodies only for touched concepts, `INDEX.md` plus
just-in-time notes on a v1 corpus without a rollup.

Since 0.25.0, a **paused-lane marker**: a task labeled `paused`
(set/cleared only via `backlog task edit --labels`, provenance as a
"paused by \<who\> \<date\>: \<why\>" append-note, machine-findable in frontmatter
`labels:`) is not a live lane — authoring excludes it from lane conflict analysis,
lists it "paused — untouched"; execution never claims, rebases, or cleans its
branches/worktrees; merge-drift hosts downgrade its findings to info.

The runbook is the **session-portable contract**: a fresh session resumes the sweep from
it plus the board alone. Because a runbook is an instruction-bearing artifact a session
*obeys*, the adopt path verifies authority before obeying — status verifiably signed-off
(only the operator flips draft → signed-off), committed, and board-backed — refusing
anything unverifiable. Phase separation holds: sweep decides no
direction (that arrives from reorient/team-review/the operator) and writes no code.

## The planted grounding is a marked block, not a file

Everything planted rides between `<!-- pdlc:grounding BEGIN/END -->` markers rendered from
`pdlc/templates/CLAUDE.md` — one decision buying three behaviors:

- **Compose with an existing `CLAUDE.md`** — appended after the user's content, never clobbered.
- **Refresh wholesale on update** — the block is boilerplate; user edits belong *outside* the markers.
- **Honest drift handling** — a block differing from the current render reports `drifted`
  and is never overwritten without `--force`; the skill diffs and gets consent.

Peer conventions are nested `pdlc:peer:backlog` / `pdlc:peer:spec-kit` sub-blocks, stripped
at render time unless opted in.

The block's "Rules that always hold" carry the foundational ("101") praxis principles from
`docs/principles.md` — **artifact-grounded action** (no action without a durable paper
trail / real evidence) and **one TASK, one PR** (a SUBTASK never gets its own PR) — so
every
bootstrapped project inherits them; each peer sub-block adds that system's mapping
(Backlog.md dotted-id subtasks ride the parent's PR; Spec Kit phases are not PR boundaries).
Since 0.16.0 the one-TASK-one-PR rule carries P2's ratified refinements — the three-tier
model and the reason-to-approve test (no PR without a stated reason for a human to
approve); `test/pdlc.test.mjs` asserts both. Since 0.14.0 the rules
also carry a **corpus-loading** rule — [[grounded-corpus-spec]] v2 consumption always-on
(INDEX-first routing, just-in-time notes, `CAPSULES.md` orientation).

## Deterministic core: scripts/plant.mjs

A dual-use module (library + CLI, [[chassis-utilities]]' `runAsCli`) on the [[installer]]
chassis and `template.mjs`. One invocation:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/plant.mjs --root <dir> [--name <name>] [--peer backlog] [--peer spec-kit] [--check] [--force]
```

renders the expected block and lands it (`created` | `appended` | `replaced` | `unchanged` |
`drifted`), gitignores `.handoff/` (the [[handoff-protocol]] transport), and stamps the `.pdlc`
sentinel — a JSON record of version + resolved name + peer choices that fresh-vs-update
keys on. Two load-bearing properties: the sentinel never advances past an unconfirmed
drifted block; `--check` writes nothing and exits 1 while planting is pending (the skill's
output gate).

Since 0.23.0 absent peers leave a **deterministic trace** (TASK-43 finding #1: omission
stays the opt-out, never silent): the sentinel records not-opted-in peers under
`peersOmitted`, and the CLI prints one stderr notice per omitted peer naming its stripped
block. `peersOmitted` derives from the peer choices, so a same-peers re-plant stays
`unchanged`.

Since 0.26.0 the rendered PROJECT_NAME stops trusting `basename(root)` (TASK-43 finding #2:
a worktree plant bakes the worktree's name into the heading; the real root then spuriously
drifts). Ladder: `--name` > the sentinel-recorded name > a worktree's PRIMARY
checkout basename (from its `gitdir:` pointer) > `basename(root)`. The recorded `name` is
sticky — a re-plant from a differently-named checkout stays `unchanged`; only `--name`
changes it, as honest drift. Legacy sentinels missing either field are never rewritten to
gain it.

## Peer utilities are first-class, not assumed

Backlog.md and GitHub Spec Kit are **officially supported peers**: the skill detects their
CLIs (`backlog`, `specify`); when absent it recommends installation (the plant's trace is
the durable record), when present it asks opt-in per peer and runs its init
(`backlog init` / `specify init --here`), skipping if already initialized. Opt-ins
select the planted convention blocks and are recorded in `.pdlc`; an update re-presents
them as defaults.

## What it deliberately does not do

Phase separation ([[skill-patterns]]) holds: bootstrap creates no `docs/wiki/`
([[grounding-wiki-plugin]]) and no `docs/course/` ([[codebase-to-course-plugin]]), and never
invokes sibling skills — it sets the table and hands off. No Stop hook: pdlc has no
lifecycle of its own; the wired-in plugins bring their own gates ([[gates-convention]]).
