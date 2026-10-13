---
title: Agent Environment Targets
aliases: [harness portability, AI environments]
tags: [agents, harness, portability, mcp, agents-md, skills]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[PDLC-Seam-Inventory]]", "[[Pipeline-Stages-as-Seams]]", "[[Real-World-Precedents]]"]
---

# Agent Environment Targets

The agent harness is itself an external system to pdlc. This note lists the surfaces each known
environment exposes (as of 2026) and maps pdlc's current Claude-Code-specific dependencies onto
them.

## Surfaces per environment

| Surface | Claude Code | Codex | Gemini CLI | opencode | Copilot / VS Code | Headless / SDK |
|---|---|---|---|---|---|---|
| Always-on instructions | `CLAUDE.md` (`@AGENTS.md` import; AGENTS.md fallback only when CLAUDE.md absent) | `AGENTS.md` | `AGENTS.md` (also GEMINI.md) | `AGENTS.md` | `AGENTS.md` | the prompt / system prompt |
| On-demand procedures | Skills (SKILL.md) | Skills | Skills | Skills (via plugin) | Skills (`.github/skills/`, `.agents/skills/`) | load file into prompt |
| Package / install unit | plugin + marketplace | plugin (`/plugins`) | extension (`gemini-extension.json`) | plugin; loader reads Claude/Codex/Cursor packages | — | container image |
| Tools to external systems | MCP (inline in `plugin.json` or `.mcp.json`) | MCP | MCP | MCP | MCP | MCP client in SDK |
| Lifecycle hooks | `Stop`, `PreToolUse`, … | hooks for manually installed plugins; hooked plugins barred from public directory | `hooks/hooks.json` | plugin code | — | the orchestrator itself |
| Sub-agent dispatch | Agent tool + `.claude/agents/*.md` | subagents | — | agents | — | SDK spawns |
| Plugin config | `userConfig` → `${user_config.KEY}`, `CLAUDE_PLUGIN_OPTION_<KEY>`; keychain for sensitive | — | manifest settings | — | — | env vars |
| Paths | `CLAUDE_PLUGIN_ROOT` (immutable), `CLAUDE_PLUGIN_DATA` (mutable) | — | `~/.gemini/extensions/<ext>` | — | — | — |

Dashes mean the fan-out did not surface a source for that cell, not that the feature is absent.
Sources: G9.

## Cross-harness standards

| Standard | Covers | Steward / adoption |
|---|---|---|
| **AGENTS.md** | always-on project instructions; plain Markdown, no schema | Agentic AI Foundation (Linux Foundation); >60k projects; 30+ agents |
| **Agent Skills (SKILL.md)** | on-demand procedures; required frontmatter only `name`, `description` | agentskills.io, originated at Anthropic; 32+ tools |
| **MCP** | agent ↔ tools/data, model-agnostic | dated spec revisions |
| **ACP** | editor ↔ agent, JSON-RPC over stdio | Zed; adopted by JetBrains, Goose, others |
| **A2A** | agent ↔ agent delegation | Google + IBM ACP merged, LF AI & Data |

Sources: G8, G9.

## pdlc's harness dependencies, by portability of the surface

| pdlc dependency | Surface used | Portable standard that covers it | Gap |
|---|---|---|---|
| Planted grounding block | `CLAUDE.md` | AGENTS.md | TASK-0134 open |
| Skills (bootstrap, sweep, …) | Claude Code plugin skills | Agent Skills SKILL.md | skill bodies name Claude Code tools (Agent tool, hooks) |
| `${CLAUDE_PLUGIN_ROOT}` script paths | Claude Code env var | none common | each harness has its own install root |
| Stop-hook gates | Claude Code `Stop` | none common; CI is harness-neutral | gates already run as CLI + GH Action |
| Root-guard `PreToolUse` | Claude Code hook | none common | — |
| Tier dispatch | Agent tool + `.claude/agents/` | none common | `model-tiers.json` is generic; generated defs are Claude-format |
| Jira provider | Atlassian MCP tools in a skill | MCP | MCP is portable; the skill text is Claude-flavoured |
| Board / gates / lifecycle | Node CLIs in `lib/` | plain processes | already harness-neutral |

Sources: G9, G10.

## Fully agentic / model-agnostic environments

- **Headless Claude** (`claude -p`, Agent SDK, `claude-code-action`) keeps the Claude Code
  surfaces (skills, hooks, plugins) but removes the human; praxisflux's spike ran a skill this way
  (G9, G10).
- **Model-agnostic SDKs** (OpenHands, OpenAI Agents SDK via LiteLLM, smolagents, Vercel AI SDK)
  supply their own tool loop. pdlc reaches them only through what they load: AGENTS.md, SKILL.md,
  MCP servers, and plain CLIs (G7, G8, G9).
- **Orchestrators** (n8n, Temporal, GHA per decision-1) treat each stage as a node; gates are the
  condition nodes; `.handoff/` maps onto a queue (G10).
- OpenHands's workspace swap (`Local` → `Docker` → `RemoteAPI`) is a precedent for a
  **workspace port**; every pdlc stage assumes a real git checkout, and decision-1 notes n8n has
  no native worktree concept (G7, G10).

## Grounding

- [[_grounding]] — G7, G8, G9, G10
- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference)
- [Codex plugins](https://developers.openai.com/codex/plugins)
- [Gemini CLI extensions](https://geminicli.com/docs/extensions/reference/)
- [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [AGENTS.md guide](https://www.morphllm.com/agents-md-guide)
