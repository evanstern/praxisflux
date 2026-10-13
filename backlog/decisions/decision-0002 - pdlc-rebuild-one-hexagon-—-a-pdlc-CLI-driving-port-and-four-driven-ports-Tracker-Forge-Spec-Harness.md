---
id: decision-0002
title: >-
  pdlc rebuild: one hexagon — a pdlc CLI driving port and four driven ports
  (Tracker, Forge, Spec, Harness)
date: '2026-10-13 02:13'
status: Accepted
---
## Context

pdlc is bound to one forge, one tracker family, one spec toolkit and one agent harness.
`pdlc:sweep` and the root-guard hook name `git`/`gh` commands literally. Skills assume the
`backlog` CLI. `plant.mjs` hard-codes `CLAUDE.md`. Dispatch and enforcement use Claude Code's
Agent tool and hooks. The operator wants pdlc to be adaptable: GitHub, GitLab and self-hosted
forges; Backlog.md, Jira, Linear and similar trackers; Spec Kit or native spec writing; Claude
Code and other agent environments, including headless and model-agnostic ones.

The research and its two analyses are in the vault branch
`vault/Ports-and-Adapters-for-PDLC/` (research 453a6d7, analysis 77a7bc9).
`Analysis-Rebuild-Architecture.md` is the design this record ratifies. Three operator
constraints, stated 2026-10-12, shape it:

1. Adapters are scripted code checked by gates. Skills route; they do not adapt.
2. Only `git`, `node` and a POSIX shell may be assumed. `gh`, `glab`, `tea`, `backlog`,
   `rg` and `jq` may be absent.
3. The spec writer is a port. Spec Kit and the native hand-authored path are its two adapters.

The board seam (specs 052-056) is the existing precedent. Its query side is real Ports and
Adapters: the `providers` registry, the `.board/links.json` receipt, status translators, and
gates that never touch the provider. Its command side is a verb table copied into skill prose,
with no enforcement and no contract tests.

## Decision

Rebuild pdlc as **one hexagon** with **one driving port** and **four driven ports**.

- **Driving port: a `pdlc` CLI** with JSON output. Skills in any harness, CI and orchestrators
  call it. Subcommands are verbs. Each verb writes or names its evidence artifact. Skills stop
  naming provider CLIs.
- **Driven ports** (Node module contracts under `lib/ports/`, adapters under
  `lib/adapters/<port>/`, each with a registry, an in-memory fake and a shared contract-test
  suite):
  - `ForTrackingWork` — backlog-md, jira, then linear and github-issues.
  - `ForHostingChanges` (the Forge port) — github, then gitlab and gitea. Local `git` stays
    unported.
  - `ForWritingSpecs` — speckit and native. Derivation (`derive(specDir) → phases`) moves behind
    the port.
  - `ForHostingAgents` (the Harness port) — claude-code, agents-md, headless. AGENTS.md
    carries always-on context (TASK-0134). SKILL.md carries procedures. MCP or the `pdlc` CLI
    carries tools. Gates and CI carry enforcement; harness hooks are optional extras.
- **Transport:** HTTP via Node's built-in `fetch` by default. Credentials come from
  `git credential fill`, then env vars. A provider CLI on `PATH` is an optional fast path.
  MCP-only providers return an ordered effect plan for the harness to execute, followed by a
  receipt sync.
- **Receipts:** gates read receipts, never providers. `.board/links.json` already does this;
  forge and spec get equivalents.
- **Floors:** a forge adapter must support merge commits and SHA-guarded merge, or
  configuration fails. Wiki `verified_against` pins depend on this.
- **Incumbent invariant:** every port lands with its current adapter (Backlog.md, GitHub,
  Spec Kit, Claude Code) behaving identically to today. Each port's PR moves every call site
  for that port before it merges.
- **Build order, one TASK and one PR each:** (1) chassis — registry, configurator, receipt
  conventions, contract-test harness, `pdlc doctor`, credential helper; (2) Harness
  (TASK-0134 plus skill cleanup); (3) Forge with the github adapter; (4) Tracker onto the
  chassis; (5) Spec; (6) further adapters, one per PR.

Out of scope: a model-provider port (`.claude/model-tiers.json` covers it), a port over local
git, and nested hexagons per plugin.

## Consequences

- `docs/board-verbs.md` becomes the first instance of a general verb-table convention, and the
  board seam moves onto shared chassis.
- The standing rule "never hand-edit Backlog markdown" conflicts with a file-writing backlog-md
  adapter. Either contract tests pin the adapter's output against files the `backlog` CLI
  produces, or that one adapter keeps `backlog` as a dependency. The Tracker task decides.
- Doctrine wording moves from forge nouns to neutral ones ("change request" for "PR") as the
  Forge port lands. That includes `docs/principles.md` and the planted grounding block.
- The gate contract (`docs/consuming-gates.md`) and receipt formats become load-bearing for
  every driver, not only CI. This is consistent with decision-1.
- Four driven ports is the upper end of the pattern author's guidance. A request for a fifth
  needs its own decision.
- No work is committed by this record alone. The rebuild proceeds through approved Backlog
  tasks, starting with an epic and the chassis task.
