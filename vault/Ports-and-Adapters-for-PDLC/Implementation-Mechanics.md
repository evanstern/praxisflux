---
title: Implementation Mechanics
aliases: [composition root, contract tests, capability detection]
tags: [hexagonal, implementation, testing]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]", "[[Pattern-Fundamentals]]", "[[Code-Examples]]", "[[Costs-and-Failure-Modes]]"]
---

# Implementation Mechanics

How the pattern is built in practice: wiring, testing, selection, capability gaps, enforcement.

## Dependency direction per side

- **Driving side:** the adapter depends on the port; the application implements it.
- **Driven side:** the application depends on the port; the adapter implements it.

(G4)

## The configurator / composition root

The composition root builds real driven adapters at startup and passes them into the use cases,
usually by constructor injection. In TypeScript/Node, manual DI is a listed option next to
containers such as Inversify and TypeDI (G4). The book leaves the configurator's form
unspecified (G2).

Observed selection mechanisms in real systems:

| System | Selector | Where |
|---|---|---|
| Renovate | `platform` config option | runtime config (G5) |
| vibey | `[platform] kind = "forgejo"` | `.vibey-gh.toml` (G5) |
| codev | `{"forge": {"provider": "jira"}}` + per-concept overrides | `.codev/config.json` (G6) |
| Nesbitt `forge` | auto-detect from git remote URL | runtime (G5) |
| claude-plugin-sdd | probe: `gh auth status`, `tea logins list -o json` | skill prose (G5) |
| praxisflux spec-bridge | `.board.json` `provider`; default `backlog` | repo file (G10) |
| praxisflux tiers | `.claude/model-tiers.json` → generated agent defs | repo file (G10) |

Three selection styles appear: **declared** (config key), **detected** (inspect remote URL or
installed CLIs), and **declared-with-detected-default**.

## Contract tests

One behaviour table, run against every adapter of a port — including the in-memory fake (G4).

- The fake is "a real implementation of the port, backed by an array".
- The suite is a parameterised function taking an adapter factory.
- It catches fake/real divergence; the cited case is a 40-char value stored intact by a fake and
  truncated by a `VARCHAR(32)` column.
- vibey adds a **property test per adapter** for one invariant: a verdict binds to a SHA, never to
  a moving head (G5).

## Transport is an adapter detail

Adapters for one port can use different transports (G5):

- vibey: GitHub via `gh` CLI; GitLab and Forgejo via REST.
- claude-plugin-sdd: `gh`, `glab`, `tea` CLIs; MCP for Jira/Linear.
- Nesbitt `forge`: one CLI front, raw `forge api` escape hatch.
- One design note states it directly: "abstracting transport, not just data".

Recorded transport hazards: `tea api` exits 0 on an HTTP error (G5); MCP-dependent instructions
fail silently when the server is absent and a `curl` fallback has no token (G5).

## Capability gaps

Three documented responses when backends differ (G4):

1. **Lowest common denominator** — expose only shared features.
2. **Reimplement** — emulate the missing feature in the adapter.
3. **Treat differently** — branch on backend, which erodes the abstraction.

Escape hatches seen in practice:

- `NotSupported` return values per method (vibey, G5).
- Raw passthrough (`forge api`, `tea api`; G5).
- **Partial providers with fallthrough** — codev's Jira preset implements only issue concepts;
  PR concepts fall through to GitHub (G6).
- **Capability flags in a registry** — praxisflux's `providers` entries carry `requiresSync` and
  a nullable `project` function, and the type of `project` selects behaviour with no
  `if (provider === …)` branch (G10).
- Renovate's stated stance: "platform-neutral, while also taking advantage of good
  platform-specific features" (G5).

## Boundary enforcement

ArchUnit / Spring Modulith (JVM) and dependency-cruiser (TS/Node) express "domain must not import
adapters" as tests run in CI (G4). praxisflux has a stated, non-tooled boundary of the same kind:
`lib/` and `gates/` make no network or MCP calls (design invariant 4, G10).

## Grounding

- [[_grounding]] — G2, G4, G5, G6, G10
- [Contract tests](https://dev.to/gabrielanhaia/contract-tests-in-php-proving-every-adapter-honors-its-port-3hmp)
- [vibey #138](https://github.com/the-vibey-project/vibey/issues/138)
- [codev #1740](https://github.com/cluesmith/codev/issues/1740)
