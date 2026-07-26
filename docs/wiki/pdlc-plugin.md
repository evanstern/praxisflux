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
verified_against: 013fbc137d04777b0057cead9a3e003c839ed9be
---

# pdlc plugin

The `pdlc` plugin (lockstep with the marketplace version) is the **suite-level installer plus
the lifecycle's own orchestrator**: `pdlc:bootstrap` stamps a folder — brand-new or an
existing codebase — as a **praxis-development-lifecycle project** whose always-on context
knows the whole loop, the suite-wide application of the [[skill-patterns]] rule "plant a
project CLAUDE.md" (a plugin has no always-on slot). Since 0.12.0 the plugin carries a
second skill, `sweep`, that runs the lifecycle it installs (below).

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

Everything pdlc plants rides between `<!-- pdlc:grounding BEGIN/END -->` markers rendered from
`pdlc/templates/CLAUDE.md`. That one decision buys the three behaviors the skill needs:

- **Compose with an existing `CLAUDE.md`** — appended after the user's content, never clobbering it.
- **Refresh wholesale on update** — the block is boilerplate; user edits belong *outside* the markers.
- **Honest drift handling** — a block differing from the current render reports `drifted`
  and is never overwritten without `--force`; the skill diffs and gets consent first.

Peer conventions are nested `<!-- pdlc:peer:backlog -->` / `<!-- pdlc:peer:spec-kit -->` sub-blocks,
stripped at render time unless opted in.

The block's "Rules that always hold" carry the foundational ("101") praxis principles from
`docs/principles.md` — **artifact-grounded action** (never act without a durable paper trail
and/or gating on real physical evidence) and **one TASK, one PR** (a SUBTASK never gets its own
PR) — so every bootstrapped project inherits them; each peer sub-block adds that system's
mapping (Backlog.md dotted-id subtasks ride the parent's PR; Spec Kit phases are not PR
boundaries). Since 0.16.0 the one-TASK-one-PR rule carries P2's ratified refinements — the
three-tier model (an EPIC gets no PR of its own) and the reason-to-approve test (a PR
exists only where it gives a human a stated reason to approve; too-small work merges into
the deliverable it serves); `test/pdlc.test.mjs` asserts both. Since 0.14.0 the rules also
carry a compact **corpus-loading** rule — [[grounded-corpus-spec]] v2 consumption made
always-on: `INDEX.md`-first routing, notes just-in-time, never bulk-load, whole-corpus
orientation via `CAPSULES.md` when it exists.

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

Since 0.23.0 absent peers leave a **deterministic trace** (the TASK-43 dogfood finding:
omission stays the opt-out, never a silent one): the sentinel records every known peer not
opted in under `peersOmitted`, and the CLI prints a one-line stderr notice per omitted peer
naming its stripped `pdlc:peer:<name>` block. `peersOmitted` derives from the peer choices,
so a same-peers re-plant stays `unchanged`; legacy sentinels without the field stay
readable, never rewritten just to gain it.

## Peer utilities are first-class, not assumed

Backlog.md and GitHub Spec Kit are **officially supported peers**: the skill detects their
CLIs (`backlog`, `specify`); when absent it recommends installation and points at the
plant's deterministic trace as the durable record, when present it asks per-peer opt-in
and, on opt-in, runs the peer's own init (`backlog init` / `specify init --here`), skipping
if already initialized. Opt-ins select the planted convention blocks and are recorded in
`.pdlc`, so an update re-presents them as defaults.

## What it deliberately does not do

Phase separation ([[skill-patterns]]) holds: bootstrap creates no `docs/wiki/`
([[grounding-wiki-plugin]]) and no `docs/course/` ([[codebase-to-course-plugin]]), and never
invokes sibling skills — it sets the table and hands off. No Stop hook: pdlc has no
lifecycle of its own; the plugins it wires in bring their own gates ([[gates-convention]]).
