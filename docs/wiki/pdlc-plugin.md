---
name: pdlc-plugin
description: The pdlc plugin — suite-level installer plus the lifecycle's orchestrator; bootstrap plants the always-on PDLC grounding as a marked CLAUDE.md block (via scripts/plant.mjs), stamps the .pdlc sentinel, gitignores .handoff/, and opts into the peer utilities (Backlog.md, Spec Kit, Jira — Backlog.md and Jira mutually exclusive); design-rounds covers the pre-spec seam where the deliverable is unknowable until an operator chooses; sweep and refactor-triage have their own notes.
kind: component
sources:
  - pdlc/.claude-plugin/plugin.json
  - pdlc/README.md
  - pdlc/skills/bootstrap/SKILL.md
  - pdlc/skills/design-rounds/SKILL.md
  - pdlc/scripts/plant.mjs
  - pdlc/scripts/tiers.mjs
  - pdlc/templates/CLAUDE.md
  - pdlc/templates/model-tiers.json
verified_against: 3fcd64f26f18465d7735d1929cf4de177e2ece90
---

# pdlc plugin

The `pdlc` plugin (lockstep with the marketplace version) is the **suite-level installer plus
the lifecycle's own orchestrator**: `pdlc:bootstrap` stamps a folder (new or existing
codebase) as a **praxis-development-lifecycle project** whose always-on context
knows the whole loop, the suite-wide application of the [[skill-patterns]] rule "plant a
project CLAUDE.md" (a plugin has no always-on slot). Three further skills run the
lifecycle it installs, each covered below.

## The sibling skills — covered in their own notes

The plugin's second skill, `sweep`, orchestrates a set of board tasks into merged PRs
(authored, operator-signed-off runbook; parallel lanes, serial merges; claim-before-work,
paused-lane markers, merge-drift gate consumption, pin-aware reconciliation):
[[pdlc-sweep]]. The third, `refactor-triage`, closes the post-sweep seam — evaluate merged
work for debt and intent drift (team-review as the engine when installed), triage every
finding with a recorded disposition, card accepted items back as sweepable tasks:
[[pdlc-refactor-triage]]. The fourth, `design-rounds`, owns the seam **before** the spec,
where sweep's ordering cannot start — work whose deliverable is unknowable until an
operator picks among options: [[pdlc-design-rounds]]. Each note carries its skill's pins.

## The planted grounding is a marked block, not a file

Everything planted rides between `<!-- pdlc:grounding BEGIN/END -->` markers rendered from
`pdlc/templates/CLAUDE.md`, buying three behaviors: it **composes** with an existing
`CLAUDE.md` (appended, never clobbered), **refreshes wholesale** on update (user edits
belong outside the markers), and handles drift **honestly** (a block differing from the
current render reports `drifted` and is never overwritten without `--force`). Peer
conventions ride nested `pdlc:peer:*` sub-blocks, stripped unless opted in. The block's
content — the 101 principles and their per-peer mappings, the corpus-loading and Gates
rules, and the `## Model tiers` section whose ladder lives in `.claude/model-tiers.json`
rather than in the block — is covered in [[pdlc-grounding-block]].

## Deterministic core: scripts/plant.mjs

A dual-use module (library + CLI, [[chassis-utilities]]' `runAsCli`) on the [[installer]]
chassis and `template.mjs`. One invocation:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/plant.mjs --root <dir> [--name <name>] [--peer backlog] [--peer spec-kit] [--peer jira] [--check] [--force]
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

Backlog.md, GitHub Spec Kit, and Jira are **officially supported peers**. Backlog.md and
Spec Kit are detected by CLI (`backlog`, `specify`); Jira differs **in kind** — there is no
CLI to detect, so availability means the Atlassian MCP server's tools are present, never
`command -v`. When a CLI peer is absent the skill recommends installation (the plant's
trace is the durable record); when present, or when Jira's MCP tools are present, it asks
opt-in per peer and runs its init (`backlog init` / `specify init --here`) or, for Jira,
resolves `cloudId`/`projectKey` by discovery rather than asking, skipping if already
initialized. **Backlog.md and Jira are mutually exclusive** — one board, singular (design
invariant 2) — so `plant.mjs` throws naming that reason if both are passed. Opt-ins select
the planted convention blocks and are recorded in `.pdlc`; an update re-presents them as
defaults.

## Opt-in root-guard hook — the suite's first PreToolUse hook

Since 0.53.0 (bootstrap 0.10.0) bootstrap can also plant a hardened **root-guard
`PreToolUse` hook** (spec 051 / TASK-101) enforcing the root-read-only + worktree-only
doctrine the block states as prose. It is the suite's **first `PreToolUse` hook** (every
other is an advisory Stop gate via [[gate-runner]]) — a new shape that hard-blocks a tool
call (exit 2). `plant.mjs --hook root-guard` **copies files into the host**: BOTH
`root-guard-hook.mjs` and its scanner `shell-scan.mjs` into `.claude/hooks/`, plus two merged
`PreToolUse` entries in `.claude/settings.json` — **opt-in, never default-on**, recorded in
the `.pdlc` `hooks` array. It replaces promptworld's copy with a quote-state scanner (spec
051 R2/R3/R5). Full policy + divergence: `pdlc/README.md`.

## What it deliberately does not do

Phase separation ([[skill-patterns]]) holds: bootstrap creates no `docs/wiki/`
([[grounding-wiki-plugin]]) and no `docs/course/` ([[codebase-to-course-plugin]]), and never
invokes sibling skills — it sets the table and hands off. No **Stop** hook: pdlc has no
lifecycle of its own; the wired-in plugins bring their own gates ([[gates-convention]]) — its
one shipped enforcement is the opt-in `PreToolUse` hook above.
