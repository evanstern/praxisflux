---
name: pdlc-plugin
description: The pdlc plugin — the suite-level installer; bootstrap plants the always-on PDLC grounding as a marked CLAUDE.md block (deterministically, via scripts/plant.mjs), stamps the .pdlc sentinel, gitignores .handoff/, and opts a project into the supported peer utilities (Backlog.md, Spec Kit).
kind: component
sources:
  - pdlc/.claude-plugin/plugin.json
  - pdlc/README.md
  - pdlc/skills/bootstrap/SKILL.md
  - pdlc/scripts/plant.mjs
  - pdlc/templates/CLAUDE.md
verified_against: 57edb4337bb6a3acb2eda39716fde84fe3ce97b9
---

# pdlc plugin

The `pdlc` plugin (lockstep with the marketplace version) is the **suite-level installer**: where
`educate:start` stamps one plugin's project type, `pdlc:bootstrap` stamps a folder — brand-new or an
existing codebase — as a **praxis-development-lifecycle project** whose always-on context knows the
whole loop. It is the suite-wide application of the [[skill-patterns]] rule "plant a project
CLAUDE.md" (a plugin has no always-on slot).

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
