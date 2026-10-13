---
title: Pipeline Stages as Seams
aliases: [driving ports, lifecycle stages]
tags: [pdlc, seams, pipeline]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[PDLC-Seam-Inventory]]", "[[Agent-Environment-Targets]]", "[[Pattern-Fundamentals]]"]
---

# Pipeline Stages as Seams

The brief names pdlc's pipelines (planning, execution, …) as seams in their own right. This note
lays the stages out against the pattern's **driving** side — the ports through which something
starts the application — and records what each stage consumes and produces today.

## The stages pdlc runs

From the four skills (G10):

| Stage | Skill | Consumes | Produces (evidence) |
|---|---|---|---|
| Install / ground | `bootstrap` | host repo, peer choices | marked grounding block, `.pdlc` sentinel, `.claude/model-tiers.json`, generated agent defs |
| Explore options | `design-rounds` | a board card | N rounds of demo artifacts (one commit + note each), decision record, spec |
| Plan | `sweep` Phase 1 | a set of board tasks | signed-off, dependency-laned runbook |
| Specify | `sweep` per task (Spec Kit) | a card | `specs/NNN-*/spec.md`, `plan.md`, `tasks.md`, `Spec:` link |
| Execute | `sweep` per task | spec + worktree | commits on a task branch via a tier-pinned implementer; `Dispatch:` line |
| Integrate | `sweep` per task | branch | PR, serial merge (merge commit), merged check |
| Re-ground | `grounding-wiki:wiki-update` | merged diff | re-pinned wiki notes |
| Evaluate | `refactor-triage` | commit range | triage record, debt cards |

The handoff between stages is always a file or a board state — never a call (G10).

## Stages read as driving ports

In the pattern, a driving port is something the application *provides* and a driver *calls*
(G1, G2). Today the only driver of each stage is a person typing a slash command in Claude Code.
Other drivers that exist for the same stages:

| Driver | Evidence it exists | Reaches the stage through |
|---|---|---|
| Operator in Claude Code | the skills themselves | `/pdlc:sweep` etc. |
| Headless Claude | `docs/headless-runner.md` — `claude -p "/spec-bridge:sync"` ran to completion 3× | `claude -p` + `--allowedTools` |
| CI | `action.yml` composite action; `@praxisflux/gates` | gate CLI exit codes 0/1/2 |
| External orchestrator | decision-1 (Proposed): n8n, Temporal, GHA, Agent SDK | gates as condition nodes; `.handoff/` as queue |
| Another agent harness | AGENTS.md / SKILL.md readers (Codex, Gemini CLI, Copilot, opencode) | planted always-on file + portable skills |

The headless spike recorded two facts relevant to any non-human driver: exit 0 means "the session
completed", not "the task succeeded"; and success is judged by gates over artifacts, never by the
transcript (G10).

## What sits inside vs outside

Using FC/IS language (see [[Related-Patterns]]), the repo already separates some stages into a
pure part and an effectful part:

| Stage | Pure part (inside) | Effectful part (outside) |
|---|---|---|
| Status | `lib/lifecycle.mjs`, `lib/spec-derive.mjs` — files → state | board writes |
| Bridge gate | `bridge.mjs` reads mirror → verdict | `board-sync` writes mirror |
| Jira writes | `renderJira` → `{tool,args,why}` list | skill executes the tool calls |
| Planting | `renderGrounding` / `extractBlock` | file writes, gitignore, sentinel |
| Tiers | `validateConfig`, `renderAgent` | write `.claude/agents/*.md` |

`renderJira` is the closest existing shape to a "command description" adapter: the pure side emits
an ordered effect list; a separate executor (here, a model) performs it, in order (G10).

## Stages that are themselves model work

Planning, design exploration, implementation, and evaluation are performed by a model, not by
code. In the AI-agent hexagon literature this is the `LLMPort` — "give me a decision over this
context" (G8). In pdlc today that port is the Claude Code Agent tool plus a tier-pinned agent
definition, verified after the fact by the `Dispatch: … served=…` record (G10).

## Grounding

- [[_grounding]] — G1, G2, G8, G10
- `docs/headless-runner.md`, `backlog/decisions/decision-1*` (repo)
