---
name: pdlc-plugin
description: The pdlc plugin — the suite-level installer plus the lifecycle's orchestrator; bootstrap plants the always-on PDLC grounding as a marked CLAUDE.md block (deterministically, via scripts/plant.mjs), stamps the .pdlc sentinel, gitignores .handoff/, and opts a project into the supported peer utilities (Backlog.md, Spec Kit); the second skill, sweep, is covered by its own note (pdlc-sweep).
kind: component
sources:
  - pdlc/.claude-plugin/plugin.json
  - pdlc/README.md
  - pdlc/skills/bootstrap/SKILL.md
  - pdlc/scripts/plant.mjs
  - pdlc/templates/CLAUDE.md
verified_against: a7fab09d261e567e0601c9928d94f123643df30a
---

# pdlc plugin

The `pdlc` plugin (lockstep with the marketplace version) is the **suite-level installer plus
the lifecycle's own orchestrator**: `pdlc:bootstrap` stamps a folder (new or existing
codebase) as a **praxis-development-lifecycle project** whose always-on context
knows the whole loop, the suite-wide application of the [[skill-patterns]] rule "plant a
project CLAUDE.md" (a plugin has no always-on slot); since 0.12.0 a second skill,
[[pdlc-sweep]], runs the lifecycle it installs.

## pdlc:sweep — covered in its own note

The plugin's second skill, `sweep`, orchestrates a set of board tasks into merged PRs
(authored, operator-signed-off runbook; parallel lanes, serial merges; claim-before-work,
paused-lane markers, merge-drift gate consumption, pin-aware reconciliation). Its full
coverage — and the pins on `skills/sweep/*` — live in [[pdlc-sweep]].

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
(INDEX-first routing, just-in-time notes, `CAPSULES.md` orientation). Since 0.34.0
(bootstrap 0.6.0) the **Gates** rule states ship-reality instead of the blanket
"plugins ship Stop hooks" overclaim (TASK-60): spec-bridge, educate, research,
reorient, and team-review ship Stop hooks; grounding-wiki's freshness gate runs as
check scripts and CI, not a hook — so a bootstrapped host is never told a gate exists
that nothing installs.

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
