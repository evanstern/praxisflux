---
title: PDLC Seam Inventory
aliases: [pdlc seams, candidate ports]
tags: [pdlc, seams, hexagonal]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Pipeline-Stages-as-Seams]]", "[[Code-Examples]]", "[[Agent-Environment-Targets]]"]
---

# PDLC Seam Inventory

Where pdlc (and the chassis it sits on) touches something outside itself today, as read from the
repo at `adefa5e`. Descriptive: each row says what is coupled and how, not what to do about it.

## External systems pdlc reaches

| Seam | Today's binding | Where it lives | Already abstracted? |
|---|---|---|---|
| **VCS (local git)** | literal `git worktree add … origin/main`, `git push -u origin`, `git switch`, `git merge --no-ff` | sweep SKILL.md (~10 `git ` hits), root-guard hook (~22), plant.mjs (~7) | No |
| **Forge (hosting)** | literal `gh pr create`, `gh pr merge --merge`, `gh api … --jq .merged` | sweep SKILL.md; root-guard blocking messages | No — GitHub assumed; repo remote is `github.com` |
| **Board / tracker** | 12 board verbs, `backlog` and `jira` columns; `.board/links.json` mirror; `providers` registry | `docs/board-verbs.md`, `lib/board-mirror.mjs`, `spec-bridge:board-sync` | **Yes** — specs 052–056 |
| **Spec system** | GitHub Spec Kit dirs (`specs/NNN-*/spec.md`, `tasks.md`) | spec-bridge, `lib/spec-derive.mjs`, `lib/spec-source.mjs` | Partly — `spec-source` abstracts *where* a spec is read from (tree vs git ref), not *which* spec format |
| **Agent harness: always-on context** | planted marked block in `<root>/CLAUDE.md` | `plant.mjs` (hardcoded target), `templates/CLAUDE.md` | No — TASK-0134 proposes `AGENTS.md` as load-bearing |
| **Agent harness: dispatch** | `.claude/agents/<tier>-implementer.md` + Agent tool `model` param; `Dispatch:` record line | `tiers.mjs`, grounding block, sweep | Partly — tiers are config; the dispatch mechanism is Claude Code's Agent tool |
| **Agent harness: enforcement** | Claude Code `Stop` / `PreToolUse` hooks | root-guard, shell-scan, read-size-gate, other plugins' Stop hooks | No — hook event names are Claude Code's |
| **Model provider** | host-form model IDs in `.claude/model-tiers.json` | tiers config | Yes, as config; IDs are host-specific |
| **Inter-plugin transport** | `.handoff/` envelopes (`id`, `kind`, `from`, `to`, `ref`) | `lib/handoff.mjs` | Yes — decision-1 calls it "a message queue in all but transport" |
| **CI** | composite GitHub Action + `@praxisflux/gates` npm package | `action.yml`, `docs/consuming-gates.md` | Partly — gates are a CLI; the wrapper is GitHub Actions |
| **Wiki freshness** | grounding-wiki notes pinned to commit SHAs | grounding-wiki | n/a — git-native |
| **Review engine** | `team-review:team-review` invoked by refactor-triage, inline fallback when absent | refactor-triage SKILL.md | Yes, as optional collaborator |

Sources: G10.

## The existing board seam, read as a hexagon

The board seam is the one place praxisflux already has a port with two adapters. Mapping its parts
onto the pattern's elements (G2, G10):

| Pattern element | Board seam part |
|---|---|
| Driven port (vocabulary) | the 12 verbs in `docs/board-verbs.md`, each with intent, preconditions, **evidence artifact** |
| Adapter (Backlog.md) | `backlog` column: literal CLI commands; `projectBacklog` recompute |
| Adapter (Jira) | `jira` column: MCP tool calls; `spec-bridge:board-sync` skill; `renderJira` returns `{tool,args,why}` |
| Capability flag | `requiresSync: true/false`; `project: fn | null` |
| Translator (ACL) | `statusMap` (injective write) / `statusReadMap` (many-to-one read); the `<!-- spec-phases -->` block for Jira ACs |
| Configurator | `.board.json` `provider` (default `backlog`) |
| Read model the core depends on | `.board/links.json` mirror — the gate's **only** read surface |
| Boundary rule | `lib/` and `gates/` make no network/MCP calls |
| Behaviour invariant | "no behavior change for a `backlog` host" |

Two features of this seam are not in the textbook pattern:

- **Adapters split by executor.** The Backlog.md adapter is runnable by `node`; the Jira adapter is
  runnable only by a model (MCP tool calls in a skill). The port is the same; who can execute the
  adapter differs.
- **A mirror between adapter and core.** The core never calls the adapter; it reads a
  byte-deterministic receipt the adapter wrote. Staleness of that receipt is itself gated.

## Coupling that is doctrine, not code

Several bindings live in prose that the model reads, not in modules:

- the sweep runbook's literal git/gh commands;
- the planted grounding block's worktree and merge rules (`--merge`, never squash — wiki pins
  depend on merge commits);
- `docs/principles.md`'s "one TASK, one PR" (a PR is a forge noun).

A port over these is a **vocabulary change in skill text** as much as a code change — the form
`docs/board-verbs.md` took for the board.

## Grounding

- [[_grounding]] — G10 (local repo facts), G2 (elements)
- `docs/board-verbs.md`, `docs/wiki/board-provider-seam.md`, `pdlc/scripts/plant.mjs` (repo)
