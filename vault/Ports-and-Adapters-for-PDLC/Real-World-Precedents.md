---
title: Real-World Precedents
aliases: [forge abstractions, tracker abstractions, plugin protocols]
tags: [hexagonal, forge, issue-tracker, plugin-architecture]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Implementation-Mechanics]]", "[[Code-Examples]]", "[[Agent-Environment-Targets]]"]
---

# Real-World Precedents

Systems that already put a port in front of a forge, a tracker, a model, or a runtime. Grouped by
the seam they abstract.

## Forge (VCS hosting) ports

| Project | Port | Adapters | Transport | Selection | Notable |
|---|---|---|---|---|---|
| **Renovate** | `Platform` (`lib/modules/platform/types.ts`) | GitHub, GitLab, Bitbucket Cloud/Server, Azure, Gitea, Forgejo; experimental Gerrit, CodeCommit, SCM-Manager, `local` | REST per platform | `platform` option | Mature, 7 supported + 4 experimental; "platform-neutral, while also taking advantage of good platform-specific features" |
| **vibey** (#138) | `ForgeAdapterInterface`, ~20 verbs → `(value, problem)` | GitHub, GitLab, Forgejo | `gh` CLI / REST / REST | TOML `kind` | Neutral nouns (`ChangeRequest`, `CheckResult`, `ProtectedRef`); `NotSupported`; SHA-binding invariant property-tested; migration partial |
| **Nesbitt `forge`** | unified CLI + Go module | GitHub, GitLab, Gitea, Forgejo, Bitbucket | REST | auto-detect remote | `forge api` raw escape hatch; motivated by GitHub-hardcoded AI agents |
| **@agntn/forges** | one TS API | GitHub, GitLab, Gitea, GitBucket | REST | — | repos, issues, PRs, review threads, commits, CI "in the same shape" |
| **gitforge** (Go) | provider registry | GitHub, GitLab, Azure DevOps | REST + go-git | discovery + factory registry | also covers local git ops and commit signing |
| **claude-plugin-sdd** (#261) | none in code — **skill prose** names commands per forge | `gh`, `glab`, `tea` | CLI | probe installed/authenticated CLIs | Moved *away* from unnamed MCP after silent write failures |

Forge-less precedent: `git format-patch` / `git send-email` / `git am` — the change request is a
patch series, review is email, revision is `-v2` (G5).

Sources: G5.

## Tracker ports

| Project | Port | Notes |
|---|---|---|
| **codev** (#1740) | provider preset; 7 issue concepts; JSON contracts in `forge-contracts.ts` | **Hybrid tracker**: issues from Jira, PR concepts fall through to GitHub. Non-numeric `KEY-123` IDs must flow through branch names, commits, spawn commands |
| **beads** (#1150) | plugin-based tracker integrations | shared sync logic, conflict resolution, field mapping |
| **Flotilla** (#21) | `IssueSource` protocol | list, search, get, **optional** transition |
| **herder** (#21) | source adapter | adapter owns auth + payload→event translation into one choke point |
| **fabrik** (#2) | `IssueTracker` interface | GitHub first, GitLab/Jira later |
| **praxisflux spec-bridge** | 12 board verbs + `.board/links.json` mirror + `providers` registry | Backlog.md and Jira; mirror is the gate's only read surface (see [[PDLC-Seam-Inventory]]) |

Tool-protocol adapters exist for every named tracker: official remote MCP servers for Atlassian
(Jira, Confluence, Bitbucket…), Linear, GitHub; a GitLab MCP server with ~80 tools (G6).

Sources: G6, G10.

## Plugin/extension protocols as ports

| System | Port form | Isolation | Versioning |
|---|---|---|---|
| **Terraform** | gRPC service; provider is a separate process; handshake on stdout | process boundary — a provider crash cannot crash core | protocol v5 (compat) + v6 |
| **Backstage** | `createExtensionPoint(type, id)` exported from a `-node` package | modules talk only through registered extension points of one plugin | per-extension-point evolution |
| **MCP** | JSON-RPC tool/resource/prompt server | process or remote | dated spec revisions |
| **ACP** (Zed) | JSON-RPC 2.0 over stdio, editor ↔ agent | process | — |

Sources: G7, G8.

## Model and runtime ports

- **Model:** routers (OpenRouter, Vercel AI Gateway, Cloudflare AI Gateway), proxies (LiteLLM,
  Portkey), or in-code registries (Vercel AI SDK) make "the model a string you can change" (G7).
- **Runtime/workspace:** OpenHands swaps `LocalWorkspace` → `DockerWorkspace` →
  `RemoteAPIWorkspace` under the same agent code; backends Docker, Local, Kubernetes, Modal,
  Remote API (G7).
- **Agent-domain ports** (dinacode): `LLMPort`, `ToolPort`, `MemoryPort`, `ObservabilityPort`
  (G8).
- praxisflux's own model seam: `.claude/model-tiers.json` names tiers and host-specific model IDs;
  `tiers.mjs` generates `.claude/agents/<tier>-implementer.md`. Host-form IDs differ
  (`cc/claude-sonnet-5[1m]` here vs `claude-sonnet-5` on a plain install) (G10).

## Grounding

- [[_grounding]] — G5, G6, G7, G8, G10
- [Renovate platforms](https://docs.renovatebot.com/modules/platform/)
- [Nesbitt — Forge](https://nesbitt.io/2026/03/13/forge.html)
- [Terraform plugin protocol](https://github.com/hashicorp/terraform/blob/main/docs/plugin-protocol/README.md)
- [Backstage extension points](https://backstage.io/docs/backend-system/architecture/extension-points/)
