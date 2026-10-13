---
title: Ports-and-Adapters-for-PDLC — Grounding
aliases: []
tags: [grounding]
type: source
created: 2026-10-11
updated: 2026-10-11
related: ["[[Ports-and-Adapters-for-PDLC]]"]
---

# Ports-and-Adapters-for-PDLC — Grounding

> Source-of-truth artifact. This is the raw, cited output of a research pass (the `deep-research`
> skill, or a direct web-search fan-out). Keep it close to verbatim — do not editorialize, prune,
> or draw conclusions here. Knowledge notes and analyses cite *into* this file.

**Research question:** What is the Ports and Adapters (hexagonal) pattern, how is it implemented
in practice, which real systems apply it to forges (VCS hosting), issue trackers, agent tools, and
model providers — and what extension surfaces do Claude Code and other AI agent environments
(Codex, Gemini CLI, opencode, model-agnostic SDKs) expose that a ported pdlc could target?
**Method:** web-search fan-out (≈30 searches + 8 page fetches across distinct angles) plus a
local read of the praxisflux repo at commit `adefa5e` · 2026-10-11

---

## G1. The pattern — Cockburn's original article (2005)

Source: [Alistair Cockburn — Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/)

- **Intent (verbatim):** "Allow an application to equally be driven by users, programs, automated
  test or batch scripts, and to be developed and tested in isolation from its eventual run-time
  devices and databases."
- **Port (verbatim):** "The application communicates over ports to external agencies. The word
  'port' is supposed to evoke thoughts of ports in an operating system, where any device that
  adheres to the protocols of a port can be plugged into it."
- **Adapter (verbatim):** "For each external device there is an adapter that converts the API
  definition to the signals needed by that device and vice versa."
- **Primary vs secondary actors:** a primary actor drives the application out of rest to perform
  functions; a secondary actor is one the application drives to get answers from or notify.
  Primary adapters naturally use test frameworks like FIT; secondary adapters use mocks.
- **Number of ports (verbatim):** "It doesn't appear that there is any particular damage in
  choosing the 'wrong' number of ports, so that remains a matter of intuition. My selection
  tends to favor a small number, two, three or four ports."
- **Configurable dependency:** applications accept repository adapters via constructor
  injection (mock vs real database).
- **Left/right:** primary ports drawn left, secondary right — reflecting use-case context
  diagrams, "not fundamental architectural difference".
- **Shape (verbatim):** "The hexagon is not a hexagon because the number six is important, but
  rather to allow people doing the drawing to have room to insert ports and adapters as they
  need, not being constrained by a one-dimensional layered drawing."
- Originally published 2005-09-04; renamed "Ports and adapters" the same year
  ([Wikipedia](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)),
  [jmgarridopaz resources](https://jmgarridopaz.github.io/content/resources.html)).

## G2. The pattern — *Hexagonal Architecture Explained* (Cockburn & Garrido de Paz, 2024)

Sources: [book notes (ebarbeito)](https://github.com/ebarbeito/learning-notes/blob/master/books/hexagonal-architecture-explained.md),
[Goodreads](https://www.goodreads.com/book/show/213172609-hexagonal-architecture-explained),
[Cockburn 2023 Budapest slides](https://alistaircockburn.com/Hexagonal%20Budapest%2023-05-18.pdf)

- Four elements: the **application** (technology-agnostic core), **ports** (boundary interfaces
  grouped by intention), **external actors** (driving or driven), **adapters** (translate actor
  requests into technology-neutral port interactions).
- A fifth element sits outside the pattern: the **configurator**, which "connects all pieces;
  knows the app, adapters, and actors; no specified implementation".
- **Driving ports** = provided interfaces the app exposes. **Driven ports** = required interfaces
  the app depends on.
- **Naming convention:** `For + verb-ing + purpose` — e.g. `ForParkingCars`, `ForStoringTickets`,
  `ForConfiguringApp`.
- **Test-first sequence:** (1) test driver → test double; (2) real actor → test double;
  (3) test driver → real actor; (4) real → real. "Once step 1 is complete, architecture exists."
- **Port quantity:** begin with one port per primary and secondary actor; driven-port count is
  set by the number of external systems the app must talk to; complexity rises and value falls
  with further splitting.
- **Misconceptions corrected:** the hexagon's six sides mean nothing; the pattern **does not
  nest** ("hexagons within hexagons easily create difficulty"); the pattern is symmetric
  architecturally but **asymmetric in code** (the app is unaware of drivers; it must *receive*
  driven actors via the configurator); not exclusive to DDD; CQRS is not inherently P&A;
  P&A has two layers (inside/outside), unlike vertical layered architecture.
- **Required constraints:** the app defines interfaces for all external interactions; ports are
  technology-neutral (business language only); actors cannot reach hexagon internals; the
  driving/driven distinction is enforced.
- **Explicitly not specified:** configurator implementation, port naming/granularity strategy,
  internal app structure, adapter design method.

## G3. Relatives — Onion, Clean, FC/IS, Anti-Corruption Layer

- Hexagonal (2005), Onion (2008), Clean (2012) share one **dependency rule**: dependencies point
  inward; "you are choosing to apply the dependency rule and picking the vocabulary". Clean adds
  an explicit use-case ring. ([Milan Jovanović](https://milanjovanovic.tech/blog/clean-architecture-vs-onion-vs-hexagonal),
  [Thoughtworks](https://www.thoughtworks.com/en-us/insights/blog/architecture/demystify-software-architecture-patterns))
- **Functional Core / Imperative Shell** (Gary Bernhardt, 2012, *Boundaries* talk): pure
  functions over values in the core; the shell does I/O. Bernhardt describes it as inspired by
  Ports & Adapters "but simply on a lower level — dealing with functions, not services". Hexagonal
  inverts source dependencies; FC/IS changes call order (shell obtains values → core evaluates →
  shell performs effects). "FC/IS ... tells you what should live inside the hexagon."
  ([kbilsted](https://github.com/kbilsted/Functional-core-imperative-shell/blob/master/README.md),
  [DEV — siy](https://dev.to/siy/functional-core-with-ports-and-adapters-3m0g),
  [HN](https://news.ycombinator.com/item?id=12605209))
- **Anti-Corruption Layer (DDD):** "An Adapter changes the shape of a call. An ACL changes the
  meaning." An ACL typically has a **Facade** (simplifies the external system), an **Adapter**
  (implements the interface the domain expects), and a **Translator** (concept mapping). Use it
  "when the models differ enough that importing the external vocabulary would constrain your
  local design." ([Milan Jovanović — ACL](https://milanjovanovic.tech/blog/anti-corruption-layer-ddd),
  [AWS Prescriptive Guidance — ACL](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/acl.html),
  [DevIQ](https://deviq.com/domain-driven-design/anti-corruption-layer/))

## G4. Implementation mechanics

- **Driving side:** adapter depends on the port; the application service implements it. **Driven
  side:** the application service depends on the port; the adapter implements it. The
  **composition root** constructs the real driven adapters at startup and hands them to use
  cases; constructor injection is the common mechanism; manual DI is a listed option in
  TypeScript/Node. ([generalistprogrammer](https://generalistprogrammer.com/tutorials/hexagonal-architecture-complete-guide),
  [matthewswong](https://www.matthewswong.com/en/blog/hexagonal-architecture-ports-and-adapters/),
  [alexrusin](https://blog.alexrusin.com/future-proof-your-code-a-guide-to-ports-adapters-hexagonal-architecture/))
- **Contract tests:** "write one table of behavior assertions and run it against every
  implementation of the port — the fake and the real adapter. Both must pass the same suite."
  Typical shape: a parameterized test function taking an adapter factory. Worked failure: an
  in-memory fake stored a 40-char SKU untouched while the MySQL `VARCHAR(32)` adapter truncated
  it; the shared contract suite is what catches the divergence. Hand-written in-memory fakes are
  "a real implementation of the port, backed by an array".
  ([DEV — contract tests PHP](https://dev.to/gabrielanhaia/contract-tests-in-php-proving-every-adapter-honors-its-port-3hmp),
  [DEV — fakes at the port (Go)](https://dev.to/gabrielanhaia/testing-hexagonal-go-fakes-at-the-port-not-mocks-everywhere-54kb),
  [DEV — tacoda](https://dev.to/tacoda/hexagonal-architecture-in-practice-ports-adapters-and-tests-that-skip-the-database-5b19))
- **Boundary enforcement:** ArchUnit rules (adapters accessed by no layer; application only by
  adapters; domain only by application), Spring Modulith `ApplicationModules.verify()`, and
  dependency-cruiser for TypeScript/Node; wired into CI as tests.
  ([clutcher/spring-modulith-module-archunit](https://github.com/clutcher/spring-modulith-module-archunit),
  [DEV — modular monolith 2026](https://dev.to/x4nent/the-modular-monolith-2026-complete-guide-spring-modulith-archunit-fitness-functions-and-lessons-878))
- **Overengineering critique:** "applying it 'by the book' can lead to overengineering"; excessive
  interfaces stem from misreading "depend on abstractions"; unnecessary layers make simple
  changes span many files; "Don't use hexagonal architecture if your project has CRUD-like
  complexity." ([Victor Rentea](https://victorrentea.ro/blog/overengineering-in-onion-hexagonal-architectures/),
  [AWS — hexagonal](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html))
- **Lowest common denominator vs leaky abstraction:** an abstraction must either reduce to the
  features all backends share, reimplement missing features, or treat backends differently —
  "making the abstraction layer redundant". Capability detection is the listed escape; semantic
  mismatch (same value meaning different things per backend) is a listed hazard.
  ([tante.cc](https://tante.cc/2009/02/15/abstractions-and-the-lowest-common-denominator/),
  [commons-os API abstraction layer](https://commons-os.github.io/patterns/api-abstraction-layer/),
  [vLLM RFC #40620](https://github.com/vllm-project/vllm/issues/40620))

## G5. Forge (VCS hosting) abstractions in the wild

- **Renovate:** "aims to be platform-neutral, while also taking advantage of good
  platform-specific features." Selected by a `platform` config option. Supported: `azure`,
  `bitbucket`, `bitbucket-server`, `forgejo`, `gitea`, `github`, `gitlab`; experimental:
  `codecommit`, `gerrit`, `local`, `scm-manager`. The shared contract lives in
  `lib/modules/platform/types.ts`; per-platform modules under `lib/modules/platform/<name>/`
  handle auth, PR/MR creation, comments, labels, status checks, quirks.
  ([Renovate — Platforms](https://docs.renovatebot.com/modules/platform/),
  [renovate lib](https://github.com/renovatebot/renovate/tree/main/lib),
  [DeepWiki — other platforms](https://deepwiki.com/renovatebot/renovate/3.3-other-platforms))
- **Forge CLIs:** "GitHub has `gh`, GitLab has `glab`, Bitbucket has various unofficial options,
  and Gitea/Forgejo has `tea`. They all manage repos, issues, pull requests, releases, and CI,
  with completely different syntax." `gh` and `glab` share mostly the same CLI shape; `tea` has
  its own conventions (`tea pulls create --title … --base … --head …`). Nesbitt's unified
  `forge` CLI auto-detects the forge from git remotes (`forge pr create --title … --head …`),
  offers `forge api` raw access for unmapped endpoints, and notes "AI coding agents are starting
  to interact with forges directly" and most are GitHub-hardcoded.
  ([Nesbitt — Forge](https://nesbitt.io/2026/03/13/forge.html),
  [Julian Hofer — gh & glab](https://julianhofer.eu/blog/2025/git-forges/),
  [gitea/tea](https://gitea.com/gitea/tea))
- **Libraries:** `@agntn/forges` (TypeScript; GitHub, GitLab, Gitea, GitBucket — repos, issues,
  PRs, review threads, commits, CI "in the same shape"); `gitforge` (Go; GitHub, GitLab, Azure
  DevOps — provider discovery, factory-based registries); `GitForge.jl` (Julia).
  ([agntn/forges](https://github.com/agntn/forges), [rios0rios0/gitforge](https://github.com/rios0rios0/gitforge),
  [GitForge.jl](https://github.com/JuliaWeb/GitForge.jl))
- **vibey issue #138** (`ForgeAdapterInterface`, ~20 verbs, each returning `(value, problem)`):
  neutral nouns `ChangeRequest` (PR/MR), `CheckResult` (Checks/pipelines), `ProtectedRef`,
  `ForgeRelease`, `ForgeIssue`, `ForgeReview`, `ForgeComment`; `ForgeKind` enum; selection via
  `[platform] kind = "forgejo"` in a TOML file; GitHub adapter wraps `gh` CLI, GitLab and Forgejo
  adapters use REST; rationale "Zero runtime dependencies is load-bearing"; a `NotSupported`
  return for platform gaps; invariant "A verdict binds to a SHA, never to a change request's
  moving head", enforced by a per-adapter property test; migration was partial — only one
  command routed through the adapter at time of writing, the rest still shelled to `gh`.
  ([vibey #138](https://github.com/the-vibey-project/vibey/issues/138))
- Other in-flight forge seams: getpaseo/paseo #1616 ("Decouple Paseo from GitHub — a pluggable
  forge abstraction"); rjwalters/loom #3131 ("Forge-Agnostic Abstraction Layer"); one design
  "abstracting transport, not just data, with each adapter choosing CLI or REST API behind the
  same ForgeService interface", with vocabulary pairs PR↔MR, checks↔pipelines,
  reviews↔approvals. ([paseo #1616](https://github.com/getpaseo/paseo/issues/1616),
  [loom #3131](https://github.com/rjwalters/loom/issues/3131))
- **Agent-skill forge selection by prose** — joestump/claude-plugin-sdd PR #261 replaced
  "unnamed MCP" forge instructions with named CLIs (`tea` for Gitea, `gh` for GitHub, `glab`
  unchanged). Rationale: "the unnamed-MCP instruction depended on a Gitea MCP server many
  installs don't have. Agents that fell back to `curl` usually had no token in their shell, so
  writes failed silently." Detection: `tea logins list -o json`, `gh auth status`. Each skill
  step names its exact command. Recorded hazard: "`tea api` exits 0 on an HTTP error".
  ([claude-plugin-sdd #261](https://github.com/joestump/claude-plugin-sdd/pull/261))
- **Forge-less git:** `git format-patch` + `git send-email` + `git am` — "doesn't depend on a
  specific platform", review happens by email reply, revisions sent with `-v2`.
  ([git-send-email](https://git-scm.com/docs/git-send-email),
  [ploum — disconnected git](https://ploum.net/2026-01-31-offline-git-send-email.html),
  [BrixIT](https://blog.brixit.nl/git-email-flow-versus-github-flow/))

## G6. Issue-tracker abstractions in the wild

- **codev #1740 — "hybrid tracker":** `.codev/config.json` `{"forge": {"provider": "jira"}}`;
  "one provider owns issues, while all PR concepts fall through to GitHub defaults" (the shape
  Linear established); per-concept overrides; preset must implement `auth-status`,
  `issue-comment`, `issue-list`, `issue-search`, `issue-view`, `recently-closed`,
  `user-identity`; preset scripts at `scripts/forge/<provider>/` emit JSON matching
  `forge-contracts.ts`; Jira's `KEY-123` non-numeric IDs must survive branch names, spawn
  commands, commit conventions.
  ([codev #1740](https://github.com/cluesmith/codev/issues/1740))
- Other tracker seams in progress: beads #1150 (plugin-based Jira/Linear/Azure DevOps with
  shared sync logic, conflict resolution, field mapping); herder #21 (source adapter owns auth +
  payload→event translation feeding one choke point); Flotilla #21 (`IssueSource` protocol:
  list, search, get, optional transition); fabrik #2 (`IssueTracker` interface + GitHub adapter
  first); rundown #102 (shared Source spec for Linear and Jira).
  ([beads](https://github.com/gastownhall/beads/issues/1150), [herder](https://github.com/tmih06/herder/issues/21),
  [Flotilla](https://github.com/Niclassslua/Flotilla/issues/21), [fabrik](https://github.com/richardcase/fabrik/issues/2),
  [rundown](https://github.com/oyvindfanebust/rundown/issues/102))
- **MCP servers for trackers/forges (2026):** official Atlassian remote MCP
  (`https://mcp.atlassian.com/v1/mcp`; Jira, Confluence, JSM, Bitbucket, Compass; OAuth 2.1 or
  API tokens); Linear remote MCP (`https://mcp.linear.app/mcp`); GitHub remote MCP
  (`https://api.githubcopilot.com/mcp/`); a GitLab MCP server listing ~80 tools.
  ([atlassian-mcp-server](https://github.com/atlassian/atlassian-mcp-server),
  [mljourney — MCP list 2026](https://mljourney.com/awesome-mcp-servers-curated-list-2026/),
  [claudemarketplaces — dev tools](https://claudemarketplaces.com/mcp/category/developer-tools))

## G7. Plugin/extension architectures as port precedents

- **Terraform:** a provider is a separate OS process speaking gRPC to Terraform Core (core =
  client, provider = server). Process isolation: a buggy provider cannot crash core; providers
  can be any gRPC language; ecosystem evolves independently. Handshake: the plugin prints
  connection details on stdout. Protocol v5 kept for compatibility, v6 current.
  ([terraform plugin-protocol README](https://github.com/hashicorp/terraform/blob/main/docs/plugin-protocol/README.md),
  [readoss walkthrough](https://readoss.com/en/hashicorp/terraform/provider-plugin-system-grpc-protocols-lifecycle))
- **Backstage:** extension points are created with `createExtensionPoint` (type + ID), exported
  from a `plugin-<id>-node` package so modules avoid depending on the plugin itself; a module
  "may only use Extension Points that belong to a single plugin" and "may only communicate
  through the registered extension points"; packaging split `-backend` / `-node` /
  `-backend-module-<id>`.
  ([Backstage — extension points](https://backstage.io/docs/backend-system/architecture/extension-points/))
- **OpenHands SDK:** model-agnostic; runtime backends Docker (default), Local, Kubernetes, Modal,
  Remote API; "The same agent code works in both deployment modes — just swap the workspace type
  (LocalWorkspace → DockerWorkspace → RemoteAPIWorkspace)."
  ([OpenHands SDK docs](https://docs.openhands.dev/sdk/arch/overview),
  [emergentmind summary](https://www.emergentmind.com/topics/openhands-software-agent-sdk))
- **Model-provider abstraction:** "put one API between the agent and model providers so the
  model becomes a string you can change" — a hosted router (OpenRouter, Vercel AI Gateway,
  Cloudflare AI Gateway), a self-hosted proxy (LiteLLM, Portkey), or an in-code provider
  registry (Vercel AI SDK). OpenAI Agents SDK and smolagents reach 100+ models through LiteLLM.
  ([Cadenya — switching providers](https://cadenya.com/other-content/switching-model-providers-for-ai-agents),
  [vercel/ai](https://github.com/vercel/ai), [LiteLLM projects](https://docs.litellm.ai/docs/project))

## G8. Hexagonal applied to AI agents; MCP as a port

- Dinacode's agent ports: **LLMPort** ("give me a decision over this context"), **ToolPort**
  ("execute this action on an external system"), **MemoryPort**, **ObservabilityPort**; adapters
  `AnthropicLLMAdapter`, `OpenAILLMAdapter`, `HubSpotMCPToolAdapter`, `PgVectorMemoryAdapter`,
  `FileSystemMemoryAdapter`, `OpenTelemetryObservabilityAdapter`; rule "No `import` in the domain
  points to an external library"; failures surface as `Result.failed()`.
  ([dinacode](https://www.dinacode.com/en/blog/hexagonal-architecture-ai-agents))
- MCP "is a standardized mechanism for exposing tools to LLMs in a model-agnostic manner";
  commentators describe MCP as "ports & adapters made explicit and protocol-driven".
  ([MCP spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25),
  [IBM — MCP architecture patterns](https://developer.ibm.com/articles/mcp-architecture-patterns-ai-systems/),
  [martia_es](https://medium.com/@martia_es/applying-hexagonal-architecture-in-ai-agent-development-44199f6136d3))
- **Agent protocols layering:** ACP (Agent Client Protocol, Zed, Aug 2025; JSON-RPC 2.0 over
  stdio) connects editor ↔ agent; MCP connects agent ↔ tools; "complementary layers". A2A
  (Google; IBM's Agent Communication Protocol merged into it under LF AI & Data, Aug 2025)
  covers agent ↔ agent delegation.
  ([morphllm — ACP](https://www.morphllm.com/agent-client-protocol),
  [CircleCI — ACP vs MCP](https://circleci.com/blog/acp-vs-mcp-whats-the-difference-for-agentic-coding/),
  [JetBrains ACP](https://www.jetbrains.com/acp/), [tyk — protocols](https://tyk.io/learning-center/agent-protocols-a-complete-guide-to-mcp-a2a-and-acp/))

## G9. Agent-environment extension surfaces (2026)

- **Claude Code plugins:** a directory of skills (SKILL.md), agents (subagent definitions),
  hooks (lifecycle commands), a JavaScript hooks module ("mod"), and MCP servers, installed as
  one unit from a marketplace. MCP servers go inline in `plugin.json` or in `.mcp.json`.
  `userConfig` prompts users at enable time and exposes values as `${user_config.KEY}` in skill
  bodies, hook commands and MCP configs, and as `CLAUDE_PLUGIN_OPTION_<KEY>` env vars;
  `sensitive: true` stores values in the system keychain. `CLAUDE_PLUGIN_ROOT` = immutable
  installed files; `CLAUDE_PLUGIN_DATA` = mutable state persisting across updates.
  ([Claude Code — Plugins](https://code.claude.com/docs/en/plugins),
  [Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference),
  [Extend Claude Code](https://code.claude.com/docs/en/features-overview))
- **Headless Claude:** `claude -p "prompt"` runs the full agent non-interactively;
  `--output-format json` / `--json-schema`, `--allowedTools`, `--permission-mode`. Claude Code
  GitHub Actions sit on the Agent SDK (SDK → `claude-code-base-action` → `claude-code-action`).
  ([Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions),
  [claudefolio — CI headless](https://claudefolio.com/guides/claude-code-in-ci-headless-sdk-github-actions))
- **OpenAI Codex:** plugins bundle skills, optional app connectors and MCP servers; installable
  via `/plugins` in CLI, app, VS Code extension; lifecycle hooks supported for manually installed
  plugins, but plugins containing hooks "aren't eligible for the public plugin directory".
  ([Codex — Plugins](https://developers.openai.com/codex/plugins),
  [The New Stack](https://thenewstack.io/openais-codex-gets-plugins/))
- **Gemini CLI:** extensions under `~/.gemini/extensions`, each with a `gemini-extension.json`
  manifest; hooks in `hooks/hooks.json` (not in the manifest).
  ([Gemini CLI extension reference](https://geminicli.com/docs/extensions/reference/))
- **opencode:** plugins add tools/integrations; an Agent-Plugins loader surfaces Claude Code,
  Codex and Cursor plugin packages' skills, MCP servers, commands, rules and agents "as if you'd
  configured them by hand". ([oc-agent-plugins](https://github.com/theacrat/oc-agent-plugins),
  [bswen — opencode extensibility](https://docs.bswen.com/blog/2026-03-05-opencode-plugins-skills-agents/))
- **AGENTS.md:** open format stewarded by the Agentic AI Foundation (Linux Foundation); released
  Aug 2025; >60,000 OSS projects; plain Markdown, no required schema; read by 30+ agents (Codex,
  Copilot, Cursor, Gemini CLI, Jules, Factory, Aider, Zed, Windsurf, Devin; Claude Code via
  import). ([morphllm — AGENTS.md](https://www.morphllm.com/agents-md-guide),
  [codersera](https://codersera.com/blog/agents-md-complete-guide-2026/))
- **Agent Skills (SKILL.md) standard (agentskills.io):** originally Anthropic; a skill is a folder
  with SKILL.md plus optional scripts/references/assets; required frontmatter only `name` (≤64
  chars) and `description` (≤1,024 chars); read by 32+ tools including Claude Code, Codex,
  Cursor, Gemini CLI, Copilot/VS Code. Project discovery paths include `.github/skills/`,
  `.claude/skills/`, `.agents/skills/`; user paths `~/.copilot/skills/`, `~/.claude/skills/`,
  `~/.agents/skills/`. ([VS Code — Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills),
  [qaskills — portability](https://qaskills.sh/blog/agent-skills-open-standard-portability))

## G10. Local repo facts (praxisflux @ `adefa5e`)

- `pdlc/` contains `skills/{bootstrap,design-rounds,refactor-triage,sweep}`, `scripts/{plant,tiers}.mjs`,
  `hooks/{root-guard-hook,shell-scan,read-size-gate}.mjs`, `templates/`. SKILL.md sizes: bootstrap
  278 lines, design-rounds 197, refactor-triage 181, sweep 462.
- Literal-command counts per file (grep, approximate): sweep SKILL.md — `gh ` 2, `git ` 10,
  dispatch/subagent mentions 36; root-guard-hook.mjs — `git ` 22, `gh ` 2 (blocking messages name
  `gh pr merge --merge`); plant.mjs — `git ` 7, `backlog` 2.
- sweep names `git worktree add .worktrees/task-<N> -b task-<N>-<slug> origin/main`,
  `git push -u origin <branch>`, `gh pr create`, `gh api ... --jq .merged`.
- `plant.mjs` exports `PEERS = ["backlog", "spec-kit", "jira"]`, `HOOKS = ["root-guard"]`,
  `SENTINEL = ".pdlc"`, `renderGrounding`, `extractBlock`, `plant(root, {peers, hooks, check,
  force, templatePath, version, name, localOnly})`; target file hardcoded `<root>/CLAUDE.md`
  (TASK-0134 description cites `plant.mjs:232`).
- `tiers.mjs`: `CONFIG_PATH = .claude/model-tiers.json`, `AGENTS_DIR = .claude/agents`,
  generates `<tier>-implementer.md` agent definitions; host config has tiers haiku/sonnet/opus,
  `defaultTier: sonnet`, `escalationTier: opus`, model IDs in host-specific `cc/…[1m]` form.
- **Existing board seam:** `docs/board-verbs.md` defines 12 verbs (`board:list`, `:view`,
  `:create`, `:link-spec`, `:ac-set`, `:ac-check`, `:status`, `:claim`, `:final`, `:note`,
  `:label`, `:sync-mirror`, `:init`) each with intent, preconditions, evidence artifact, and a
  `backlog` and `jira` column; invariant "no behavior change for a `backlog` host".
  `lib/board-mirror.mjs` holds `providers = { backlog: {requiresSync:false, project:projectBacklog},
  jira: {requiresSync:true, project:null} }`; `.board/links.json` mirror is the gate's only read
  surface; `lib/` and `gates/` make no network/MCP calls; Jira projection lives in the
  `spec-bridge:board-sync` skill; `renderJira` returns `{tool,args,why}` descriptions without
  calling. Two status maps: `statusMap` (write, must be injective) and `statusReadMap` (read,
  many-to-one). (docs/wiki/board-provider-seam.md)
- **Other existing seams:** `lib/handoff.mjs` (`.handoff/` envelope: `id`, `kind`, `from`, `to`,
  `ref`); `lib/lifecycle.mjs` (`createLifecycle({states, artifacts, requires})`);
  `lib/spec-source.mjs` (spec-dir read closures: working tree then git refs via
  `git show`, read-only). decision-1 (Proposed) frames gates + lifecycle + handoffs as substrate
  for an external orchestrator (n8n, Temporal, GHA, Agent SDK) and calls `.handoff/` "a message
  queue in all but transport".
- `docs/headless-runner.md`: `claude -p "/spec-bridge:sync" --allowedTools … --output-format json`
  ran three scenarios to completion ($0.67–$0.75, 43–49 s); "Exit semantics are about the
  session, not the task"; `--allowedTools` is "additive, not a sandbox"; verdict = gates, not
  transcript.
- TASK-0134 (To Do, High): move the planted grounding to `AGENTS.md`, `CLAUDE.md` becomes an
  `@AGENTS.md` pointer; cites Claude Code v2.1.277 (2026-09-18) adding an AGENTS.md fallback only
  when `CLAUDE.md` is absent, toggleable, unsupported on Bedrock/Vertex/Foundry.

## Sources

Pattern: [Cockburn 2005](https://alistair.cockburn.us/hexagonal-architecture/) ·
[Wikipedia](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)) ·
[book notes](https://github.com/ebarbeito/learning-notes/blob/master/books/hexagonal-architecture-explained.md) ·
[Cockburn 2023 slides](https://alistaircockburn.com/Hexagonal%20Budapest%2023-05-18.pdf) ·
[jmgarridopaz](https://jmgarridopaz.github.io/content/resources.html) ·
[Jovanović — Clean/Onion/Hex](https://milanjovanovic.tech/blog/clean-architecture-vs-onion-vs-hexagonal) ·
[Jovanović — ACL](https://milanjovanovic.tech/blog/anti-corruption-layer-ddd) ·
[AWS ACL](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/acl.html) ·
[AWS hexagonal](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html) ·
[FC/IS](https://github.com/kbilsted/Functional-core-imperative-shell/blob/master/README.md) ·
[Rentea — overengineering](https://victorrentea.ro/blog/overengineering-in-onion-hexagonal-architectures/) ·
[tante — LCD](https://tante.cc/2009/02/15/abstractions-and-the-lowest-common-denominator/)

Mechanics: [generalistprogrammer](https://generalistprogrammer.com/tutorials/hexagonal-architecture-complete-guide) ·
[contract tests](https://dev.to/gabrielanhaia/contract-tests-in-php-proving-every-adapter-honors-its-port-3hmp) ·
[fakes at the port](https://dev.to/gabrielanhaia/testing-hexagonal-go-fakes-at-the-port-not-mocks-everywhere-54kb) ·
[ArchUnit/Modulith](https://github.com/clutcher/spring-modulith-module-archunit)

Forges & trackers: [Renovate](https://docs.renovatebot.com/modules/platform/) ·
[Nesbitt Forge](https://nesbitt.io/2026/03/13/forge.html) · [agntn/forges](https://github.com/agntn/forges) ·
[gitforge](https://github.com/rios0rios0/gitforge) · [vibey #138](https://github.com/the-vibey-project/vibey/issues/138) ·
[claude-plugin-sdd #261](https://github.com/joestump/claude-plugin-sdd/pull/261) ·
[codev #1740](https://github.com/cluesmith/codev/issues/1740) · [beads #1150](https://github.com/gastownhall/beads/issues/1150) ·
[git-send-email](https://git-scm.com/docs/git-send-email) · [Atlassian MCP](https://github.com/atlassian/atlassian-mcp-server)

Plugin systems & agents: [Terraform plugin protocol](https://github.com/hashicorp/terraform/blob/main/docs/plugin-protocol/README.md) ·
[Backstage extension points](https://backstage.io/docs/backend-system/architecture/extension-points/) ·
[OpenHands SDK](https://docs.openhands.dev/sdk/arch/overview) · [Cadenya](https://cadenya.com/other-content/switching-model-providers-for-ai-agents) ·
[dinacode](https://www.dinacode.com/en/blog/hexagonal-architecture-ai-agents) · [MCP spec](https://modelcontextprotocol.io/specification/2025-11-25) ·
[ACP](https://www.morphllm.com/agent-client-protocol) · [Claude Code plugins](https://code.claude.com/docs/en/plugins) ·
[plugin reference](https://code.claude.com/docs/en/plugins-reference) · [Claude Code GHA](https://code.claude.com/docs/en/github-actions) ·
[Codex plugins](https://developers.openai.com/codex/plugins) · [Gemini extensions](https://geminicli.com/docs/extensions/reference/) ·
[oc-agent-plugins](https://github.com/theacrat/oc-agent-plugins) · [AGENTS.md guide](https://www.morphllm.com/agents-md-guide) ·
[VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
