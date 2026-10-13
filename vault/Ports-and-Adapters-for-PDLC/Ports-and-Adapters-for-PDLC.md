---
title: Ports-and-Adapters-for-PDLC
aliases: [hexagonal pdlc, pdlc ports]
tags: [hexagonal, ports-adapters, pdlc, agents]
type: moc
created: 2026-10-11
updated: 2026-10-12
related: ["[[Brief-and-Assumptions]]", "[[Pattern-Fundamentals]]", "[[Related-Patterns]]", "[[Implementation-Mechanics]]", "[[Real-World-Precedents]]", "[[Code-Examples]]", "[[PDLC-Seam-Inventory]]", "[[Pipeline-Stages-as-Seams]]", "[[Agent-Environment-Targets]]", "[[Costs-and-Failure-Modes]]", "[[Analysis-Which-Ports-and-How]]", "[[Analysis-Rebuild-Architecture]]"]
---

# Ports-and-Adapters-for-PDLC

The Ports and Adapters (hexagonal) pattern, how it is implemented, who has applied it to forges,
trackers, models and runtimes, and how pdlc's current external couplings and pipeline stages line
up against it — including the agent harnesses (Claude Code and others) pdlc could target. Gathered
to ground a pdlc refactor whose direction is not yet decided.

## Scope

**In:** the pattern (Cockburn 2005, the 2024 book) and its relatives (Onion, Clean, FC/IS, ACL);
implementation mechanics (configurator, contract tests, capability gaps, enforcement); real forge,
tracker, plugin-protocol, model and runtime abstractions with code where available; an inventory
of pdlc's seams at `adefa5e`; pipeline stages as driving ports; agent-environment extension
surfaces (Claude Code, Codex, Gemini CLI, opencode, Copilot, headless/SDK) and the cross-harness
standards (AGENTS.md, Agent Skills, MCP, ACP, A2A).
**Out:** choosing ports or a refactor direction (that is an analysis); vendor feature comparisons
of Jira vs Linear vs GitHub Issues; detailed per-API endpoint mapping.

## What is known

- **The pattern** is two layers — inside and outside — joined by purpose-named ports; driving
  ports are provided, driven ports are required; a configurator outside the pattern wires
  adapters in. Few ports is the author's stated preference. → [[Pattern-Fundamentals]]
- **Its relatives** share the inward dependency rule; FC/IS says what goes inside; an ACL
  translates *meaning*, not just call shape (PR vs MR, 15 statuses vs 3). → [[Related-Patterns]]
- **In practice** adapters are selected by declared config, detection, or both; contract tests run
  one suite against every adapter including a fake; transport (CLI, REST, MCP) is an adapter
  detail; capability gaps are handled by LCD, emulation, `NotSupported`, passthrough, or
  partial-provider fallthrough. → [[Implementation-Mechanics]]
- **Precedents exist for each seam pdlc has:** Renovate and several newer projects for forges;
  codev's hybrid tracker and others for issues; Terraform/Backstage/MCP/ACP for plugin protocols;
  LiteLLM/AI SDK for models; OpenHands for workspaces. → [[Real-World-Precedents]]
- **Code shapes** for a forge port, CLI adapters, a forge-less patch adapter, a configurator, a
  shared contract test, a tracker port with fallthrough and status translation, and adapter-as-
  prose. → [[Code-Examples]]
- **pdlc today** has one fully-formed port (the board seam: verbs + mirror + providers registry +
  status translators) and several hard bindings (git/`gh` in sweep and root-guard; `CLAUDE.md` as
  plant target; Claude Code hooks and Agent tool). Much coupling is in skill prose, not code.
  → [[PDLC-Seam-Inventory]]
- **Pipeline stages** (ground, explore, plan, specify, execute, integrate, re-ground, evaluate)
  already hand off only through files; drivers beyond the human operator — headless Claude, CI,
  orchestrators, other harnesses — are documented. → [[Pipeline-Stages-as-Seams]]
- **Agent environments** converge on AGENTS.md, SKILL.md and MCP; hooks, sub-agent dispatch,
  plugin paths and config remain per-harness. → [[Agent-Environment-Targets]]
- **Known costs**: overengineering, LCD, leaks, semantic mismatch, fake drift, silent transport
  failure, partial migration. → [[Costs-and-Failure-Modes]]

## Notes

- [[Brief-and-Assumptions]] — the request verbatim, assumptions, open questions
- [[Pattern-Fundamentals]] — Cockburn's definitions, elements, driving/driven, naming, port count
- [[Related-Patterns]] — Onion, Clean, FC/IS, Anti-Corruption Layer; vocabulary mismatch table
- [[Implementation-Mechanics]] — configurator, selection styles, contract tests, transport, capability gaps, enforcement
- [[Real-World-Precedents]] — forge, tracker, plugin-protocol, model and runtime abstractions
- [[Code-Examples]] — illustrative Node ESM sketches of ports, adapters, configurator, contract tests
- [[PDLC-Seam-Inventory]] — pdlc's external couplings at `adefa5e`; the board seam read as a hexagon
- [[Pipeline-Stages-as-Seams]] — lifecycle stages as driving ports; pure vs effectful parts
- [[Agent-Environment-Targets]] — extension surfaces per harness; cross-harness standards; pdlc's harness dependencies
- [[Costs-and-Failure-Modes]] — documented failure modes and counter-measures

## Analyses

- [[Analysis-Rebuild-Architecture]] — the rebuild target under operator constraints (scripted adapters, tool agnosticism, spec port): `pdlc` CLI as driving port, four driven ports, receipts, floors; supersedes parts of the first analysis
- [[Analysis-Which-Ports-and-How]] — which ports, in what form, in what order (verdict: Tracker/Forge/Harness as board-seam-style verb tables; Harness first)

## Open questions

- Per-harness hook parity: which harnesses expose a `Stop`/`PreToolUse` equivalent, and with what
  semantics? The fan-out found Gemini CLI and Codex hooks but not their event lists.
- Linear's and GitLab's MCP tool surfaces at the verb level (vs Jira's, already mapped in
  `docs/board-verbs.md`).
- Sub-agent dispatch with a pinned model outside Claude Code — which harnesses support it.
- Verified `glab` / `tea` flag spellings for the verbs sweep uses (Code-Examples table is
  unverified).
- Whether Spec Kit has peers worth a spec-format port (other spec-driven toolkits).

## Grounding

- [[_grounding]] — web-search fan-out + local repo read, 2026-10-11
- [Cockburn — Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Renovate platforms](https://docs.renovatebot.com/modules/platform/)
- [codev #1740](https://github.com/cluesmith/codev/issues/1740)
- [Agent Skills (VS Code)](https://code.visualstudio.com/docs/agent-customization/agent-skills)
