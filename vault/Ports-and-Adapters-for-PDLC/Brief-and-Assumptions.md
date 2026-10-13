---
title: Brief and Assumptions
aliases: []
tags: [brief]
type: note
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]"]
---

# Brief and Assumptions

## The request (restated)

> I would like to start a new vault and do research on the Ports and Adapters (hexagonal
> architecture) pattern in relation to the pdlc plugin. I am planning a refactor of the plugin
> which would identify seams which we can turn into ports and then write adapters to handle
> specific implementation. A good example of this would be a port for the VCS (version control
> system) and adapters for GitHub, GitLab, and self-hosted git repos. Another port could be the
> interface into backlog and ticketing systems with adapters such as Backlog.md, Linear, Jira,
> etc. I'd like the research to focus on the pattern, how it could be used inside this plugin
> environment, and implementation details around how one might effectively architect such a
> plugin. PDLC itself is not necessarily the focus, but the current abilities it has and the
> pipelines it outlines are certainly seams themselves (planning, execution, etc) and should be
> considered during the research. End result of this: A vault with detailed information about
> the pattern, implementation, examples of real world scenarios (with code if possible), and
> information about how plugins in Claude AND other AI environments (including fully agentic,
> model agnostic environments) could be targeted vis-a-vis the current pdlc use cases. The
> intent is to use this vault to ground further design and refactor of the plugin in an
> as-yet undecided direction.

## Assumptions made

- **"Vault" = a new branch in the existing praxisflux vault** (`vault/`), not a second vault.
  The existing vault already has the research plugin's sentinel and templates.
- **Neutral only.** The refactor direction is undecided, so this branch records options and
  precedents without ranking them. A later `analyze-vault` pass forms the verdict.
- **Code examples are illustrative.** Where no single source supplies runnable code, notes carry
  small JavaScript (Node ESM, zero-dependency — the praxisflux chassis idiom) sketches assembled
  from the cited patterns. Each sketch is labelled as illustrative and is not a design proposal.
- **"Self-hosted git"** is read as covering both self-hosted forges (Gitea, Forgejo, GitLab CE)
  and forge-less git (bare repos, patch/email flow).
- **pdlc's current state** is taken from the repo at commit `adefa5e` and its `docs/wiki/`, not
  from memory.

## Open questions (for the operator)

- Is the target a **ported pdlc inside Claude Code** (adapters behind the same skills), a
  **harness-portable pdlc** (same doctrine runs in Codex/Gemini/opencode), or a **headless
  orchestrated pdlc** (decision-1's direction)? These pull the port boundaries to different
  places.
- Should adapters be **code** (Node modules behind an interface), **prose** (skill text naming
  per-provider commands, as `docs/board-verbs.md` does today), or **protocol** (MCP servers)?
- Does the board seam's existing shape (verbs + mirror + providers registry) count as the
  template for new ports, or as one candidate among several?
- Is mixed-provider operation in scope (issues in Jira, PRs on GitHub — the "hybrid tracker")?
