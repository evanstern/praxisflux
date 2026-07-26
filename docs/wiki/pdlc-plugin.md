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
verified_against: 90fd8f2e48e6c57a34c99a8b02fffe74ed593284
---

# pdlc plugin

The `pdlc` plugin (lockstep with the marketplace version) is the **suite-level installer plus
the lifecycle's own orchestrator**: where `educate:start` stamps one plugin's project type,
`pdlc:bootstrap` stamps a folder — brand-new or an existing codebase — as a
**praxis-development-lifecycle project** whose always-on context knows the whole loop. It is
the suite-wide application of the [[skill-patterns]] rule "plant a project CLAUDE.md" (a
plugin has no always-on slot). Since 0.12.0 the plugin carries a second skill, `sweep`, that
runs the lifecycle it installs (below).

## pdlc:sweep — the board-sweep orchestrator

`skills/sweep/SKILL.md` (with `skills/sweep/templates/runbook.md`) orchestrates a **set of
board tasks** into merged PRs. Two phases, gate → work → gate:

- **Author:** from task ids / a label / a synthesis doc, derive dependency-ordered **lanes**
  (the governing rule is *develop in parallel, merge serially*; contract-shaped work leads
  because a published interface unblocks consumers while internals lag), per-task model
  tiers from the host rubric, the project's per-PR gates enumerated, concurrency doctrine
  with named hotspots, operator checkpoints, and a done-means — written from the template to
  `docs/design/<slug>-runbook.md`, committed, then **stopped for operator sign-off** on the
  lanes.
- **Execute:** per task, the host PDLC loop instantiated — **claim before work** (the
  first commit claims the task: board card → In Progress and the spec number's
  directory — before any authoring; push immediately, never force-push a claim; a
  rejected push means the race was lost — fetch and re-read the board/`specs/` before
  assuming, then stop the lane and surface it to the operator if genuinely contended, or
  rebase-and-repush if the rejection was unrelated), Spec Kit cycle, `spec-bridge:link`,
  worktree, delegated implementation (never inline), per-PR gates, rebase, PR, serial
  merge with verify-merged-before-cleanup, re-ground, one execution-log line.

Since 0.12.1 both phases consume a host **merge-drift gate** when the precondition probe
finds one (`scripts/check-merge-drift.mjs`, the promptworld spec-051 pattern —
`session`/`worktree`/`pr` modes, 0/1/2 exit codes): `session` at sweep start subsumes the
root fetch/ff-pull, prescribes janitor cleanup, and feeds its n-way drift matrix into lane
construction; `worktree [--spec NNN]` mechanizes the fresh-root and spec-number checks
before each `git worktree add`; `pr` blocks each `gh pr create` (and re-runs after every
rebase) on predicted conflicts, its overlap warnings doubling as the same-PR companion
checklist. The runbook template records the probe result so adopting sessions don't
re-derive it. When no gate ships, the raw git doctrine stands unchanged.

Since 0.13.0 the runbook template's concurrency doctrine replaces the bare
spec-number-collision check with the fuller claim-before-work doctrine above, and names
the mechanical checks for hosts that ship a merge-drift gate: `claim --dir NNN-slug`
before creating any new `specs/NNN-*` dir (blocks on a taken number), and
`worktree --spec NNN --task TASK-<n>` when cutting the worktree (warns if the card isn't
claimed; accepts a spec dir already claimed by that same task).

Since 0.14.0 sweep consumes the corpus per [[grounded-corpus-spec]] v2 at its two
whole-corpus orientation moments: runbook authoring's project reading and each task's
re-ground step orient via the corpus's `CAPSULES.md` when present, loading full note
bodies only for the concepts the scoped tasks (or the merge) actually touch, and fall
back to `INDEX.md` plus just-in-time notes on a v1 corpus without a rollup.

The runbook is the **session-portable contract**: a fresh session resumes the sweep from the
runbook + board alone. Because a runbook is an instruction-bearing artifact a session
*obeys*, the adopt path verifies authority before obeying — status verifiably signed-off
(only the operator flips draft → signed-off; the author never pre-fills it), committed, and
board-backed — refusing anything unverifiable. Phase separation holds: sweep decides no
direction (that arrives from reorient/team-review/the operator) and writes no code.

## The planted grounding is a marked block, not a file

Everything pdlc plants rides between `<!-- pdlc:grounding BEGIN/END -->` markers rendered from
`pdlc/templates/CLAUDE.md`. That one decision buys the three behaviors the skill needs:

- **Compose with an existing `CLAUDE.md`** — appended after the user's content, never clobbering it.
- **Refresh wholesale on update** — the block is boilerplate; user edits belong *outside* the markers.
- **Honest drift handling** — an on-disk block that differs from what the current plugin version
  would render is reported as `drifted` and is never overwritten without `--force`; the skill diffs
  and gets consent first.

Peer conventions are nested `<!-- pdlc:peer:backlog -->` / `<!-- pdlc:peer:spec-kit -->` sub-blocks,
stripped at render time unless opted in.

The block's "Rules that always hold" carry the foundational ("101") praxis principles from
`docs/principles.md` — **artifact-grounded action** (never act without a durable paper trail
and/or gating on real physical evidence) and **one TASK, one PR** (a SUBTASK never gets its own
PR) — so every bootstrapped project inherits them; each peer sub-block adds that system's
mapping (Backlog.md dotted-id subtasks ride the parent's PR; Spec Kit phases are not PR
boundaries). `test/pdlc.test.mjs` asserts the template carries both. Since 0.14.0 the
rules also carry a compact **corpus-loading** rule — the [[grounded-corpus-spec]] v2
consumption protocol made always-on: `INDEX.md`-first routing, notes just-in-time, never
bulk-load, whole-corpus orientation via `CAPSULES.md` when it exists.

## Deterministic core: scripts/plant.mjs

A dual-use module (library + CLI, guarded by [[chassis-utilities]]' `runAsCli`) built on the
[[installer]] chassis (`ensureGitignore`, `verifyPresent`) and `template.mjs`. One invocation:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/plant.mjs --root <dir> [--peer backlog] [--peer spec-kit] [--check] [--force]
```

renders the expected block and lands it (`created` | `appended` | `replaced` | `unchanged` |
`drifted`), gitignores `.handoff/` (the [[handoff-protocol]] transport), and stamps the `.pdlc`
sentinel — a JSON record of plugin version + peer choices that `installMode` keys fresh-vs-update
on. Two safety properties are load-bearing: the sentinel never advances past an unconfirmed drifted
block, and `--check` writes nothing and exits 1 while planting is pending (the skill's output gate).

## Peer utilities are first-class, not assumed

Backlog.md and GitHub Spec Kit are **officially supported peers**: the skill detects their CLIs
(`backlog`, `specify`); when absent it recommends installation, when present it asks per-peer
opt-in and, on opt-in, runs the peer's own init (`backlog init` / `specify init --here`), skipping
when `backlog/` or `.specify/` already exist. Opt-ins select the planted convention blocks and are
recorded in `.pdlc`, so an update re-presents them as defaults.

## What it deliberately does not do

Phase separation ([[skill-patterns]]) holds: bootstrap creates no `docs/wiki/` (that's
[[grounding-wiki-plugin]]), no `docs/course/` ([[codebase-to-course-plugin]]), and never invokes
sibling skills — it sets the table and hands off. It ships no Stop hook: pdlc has no lifecycle of
its own; the plugins it wires in bring their own gates ([[gates-convention]]).
