# praxisflux

A Claude Code **plugin marketplace** that unifies a set of composable knowledge-work
plugins on one shared Node chassis. The plugins form a **research → teach → build** loop:
each is independently installable, aware of the others, and composes only through files +
gates — never by calling each other directly.

> Status: **under construction.** The plan lives in Backlog (`backlog task list --plain`).
> Seven plugins are registered in the marketplace: `research`, `grounding-wiki`, `educate`,
> `build` (a scaffold), `codebase-to-course`, `spec-bridge`, and `pdlc`. This repo is the unification
> target for the standalone `research` skills, the `educate` plugin, and the
> `codebase-to-course` skill.

## Plugins

| Plugin | Role | Placement |
|---|---|---|
| **research** | Gather cited facts into an isolated, interlinked Markdown "thinking vault" branch (EMBED → QUERY → RENDER). Neutral notes, then opinionated analysis, then an optional rendered page. | **Drop-anywhere** — a vault can live in any folder. |
| **grounding-wiki** | Build and maintain a **code-grounded corpus** (`docs/wiki/`) for a codebase: per-concept notes pinned to the commit they were verified against, a freshness gate, and an in-place update loop. | **Runs on a target codebase.** |
| **educate** | Turn a folder into a Socratic learning project: teach, author a build SPEC, and gate each lesson `done` on auditable artifacts. | **Favored home folder** (detected via a `topics/` marker). |
| **build** | *(scaffold — split out of educate)* Implement a SPEC and return findings for the lesson to fold back in. | Runs where the work is. |
| **codebase-to-course** | Turn any codebase into an interactive single-page HTML course for non-technical learners. Reads a grounded corpus (`docs/wiki/`) as its primary analysis input when present; output gated on the chassis. | **Runs on a target codebase** (course lands in `docs/course/`). |
| **spec-bridge** | Backlog.md as the kanban view over GitHub Spec Kit specs: link a task to a spec dir, sync status one-way from spec artifacts, gate "status can't exceed proven artifacts". | **Runs on a project with `backlog/` + `specs/`.** |
| **pdlc** | Bootstrap a new **or existing** project for the praxis development lifecycle: plant the always-on PDLC grounding (a marked `CLAUDE.md` block), gitignore the `.handoff/` transport, and opt into the supported peer utilities (Backlog.md, Spec Kit) — running their inits on opt-in. | **Runs on any project folder** (stamps a `.pdlc` sentinel). |

## The loop

Two grounding sources — `research` (external topics) and `grounding-wiki` (a codebase) — feed the
teach → build loop:

```
research (topics) ─┐
                   ├─grounding─▶ educate ──SPEC──▶ build ──findings──▶ educate (revise)
grounding-wiki ────┘             (teach)          (implement)          (fold in)
   (codebase)  └──corpus──▶ codebase-to-course (interactive course in docs/course/)
```

## Shared chassis (`lib/`)

Zero-dependency Node modules, reached from each plugin through a committed `lib -> ../lib`
symlink that marketplace installs and `dist/` packaging dereference into a real copy:
`project-root` · `gate-runner` (Stop hook) · `markdown` · `selfcontained` (HTML) ·
`lifecycle` · `installer` · `handoff` (`.handoff/` transport) · `dates` · `template` ·
`spec-derive` (Spec Kit → kanban state) · `cli` (symlink-safe run-as-CLI guard).

## Principles

The foundational ("101") rules are stated canonically in
[`docs/principles.md`](docs/principles.md) and planted into every bootstrapped project's
always-on grounding:

- **Artifact-grounded action (P1)** — never act without leaving a durable paper trail
  and/or gating against real physical evidence; artifacts are the only currency of state
  and decision.
- **One TASK, one PR (P2)** — a top-level task maps 1:1 to a PR; subtasks (any system's
  spelling of them) never get their own PR — they ride the parent task's branch.

Suite-design principles:

- **Shared plumbing, domain-specific content** — plugins share the chassis, not their vocabularies.
- **Phase-separated skills** that know nothing of each other; they compose through files + gates.
- **Plant a project `CLAUDE.md`** — a plugin has no always-on slot, so it installs one.
- **Gates enforce "status can't exceed proven artifacts."**
- **Handoffs** ride a shared transport (gitignored `.handoff/` payloads, evidence in tracked
  state); payload schemas stay plugin-specific.

## Docs

- [`docs/principles.md`](docs/principles.md) — the foundational ("101") praxis principles:
  artifact-grounded action and one-TASK-one-PR, stated task-system-agnostically; the
  upstream source downstream constitutions reference.
- [`docs/skill-patterns.md`](docs/skill-patterns.md) — how to author a plugin/skill in this suite
  (the shared patterns; read before adding a plugin).
- [`docs/handoff-protocol.md`](docs/handoff-protocol.md) — the inter-plugin handoff transport.
- [`docs/headless-runner.md`](docs/headless-runner.md) — run a skill non-interactively
  (`claude -p`), gate-verified: the agent-node recipe for orchestrators, with the
  headless-readiness checklist.
- [`docs/orchestration/`](docs/orchestration/) — the n8n pilot (workflow, runner service,
  run log) and the orchestrator findings: the praxisflux flow under external orchestration
  with humans only at the approval seam.
- [`docs/consuming-gates.md`](docs/consuming-gates.md) — run the gates in another repo's CI via
  the composite action (`uses: evanstern/praxisflux@v<version>`) or anywhere via
  `npx @praxisflux/gates`.

## Install

Add the marketplace from GitHub (needs git access to this repo while it's private), or from a
local clone:

```
/plugin marketplace add evanstern/praxisflux     # or: /plugin marketplace add /path/to/praxisflux
/plugin install research@praxisflux
/plugin install grounding-wiki@praxisflux
/plugin install educate@praxisflux
/plugin install build@praxisflux
/plugin install codebase-to-course@praxisflux
/plugin install spec-bridge@praxisflux
/plugin install pdlc@praxisflux
```

Each plugin is independently installable — take only the legs of the loop you need.

Every merge to `main` publishes a GitHub Release `v<version>` (the marketplace version) with a
self-contained zip per plugin (`<plugin>-v<version>.zip`) — versioned snapshots for installing
without the marketplace, or for pinning. The pipeline is documented in
[`docs/releasing.md`](docs/releasing.md).

Other repos can enforce the gates without installing anything: the repo doubles as a
composite GitHub Action pinned by the same release tags, and each release also publishes the
gate CLI to npm as `@praxisflux/gates` (same version) for non-GitHub CI and local one-offs — see
[`docs/consuming-gates.md`](docs/consuming-gates.md).
