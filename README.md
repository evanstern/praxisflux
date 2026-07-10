# praxis

A Claude Code **plugin marketplace** that unifies a set of composable knowledge-work
plugins on one shared Node chassis. The plugins form a **research → teach → build** loop:
each is independently installable, aware of the others, and composes only through files +
gates — never by calling each other directly.

> Status: **under construction.** The plan lives in Backlog (`backlog task list --plain`).
> Five plugins are registered in the marketplace: `research`, `grounding-wiki`, `educate`,
> `build` (a scaffold), and `codebase-to-course`. This repo is the unification target for the
> standalone `research` skills, the `educate` plugin, and the `codebase-to-course` skill.

## Plugins

| Plugin | Role | Placement |
|---|---|---|
| **research** | Gather cited facts into an isolated, interlinked Markdown "thinking vault" branch (EMBED → QUERY → RENDER). Neutral notes, then opinionated analysis, then an optional rendered page. | **Drop-anywhere** — a vault can live in any folder. |
| **grounding-wiki** | Build and maintain a **code-grounded corpus** (`docs/wiki/`) for a codebase: per-concept notes pinned to the commit they were verified against, a freshness gate, and an in-place update loop. | **Runs on a target codebase.** |
| **educate** | Turn a folder into a Socratic learning project: teach, author a build SPEC, and gate each lesson `done` on auditable artifacts. | **Favored home folder** (detected via a `topics/` marker). |
| **build** | *(scaffold — split out of educate)* Implement a SPEC and return findings for the lesson to fold back in. | Runs where the work is. |
| **codebase-to-course** | Turn any codebase into an interactive single-page HTML course for non-technical learners. Reads a grounded corpus (`docs/wiki/`) as its primary analysis input when present; output gated on the chassis. | **Runs on a target codebase** (course lands in `docs/course/`). |
| **spec-bridge** | Backlog.md as the kanban view over GitHub Spec Kit specs: link a task to a spec dir, sync status one-way from spec artifacts, gate "status can't exceed proven artifacts". | **Runs on a project with `backlog/` + `specs/`.** |

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

Zero-dependency Node modules vendored into each plugin at build time:
`project-root` · `gate-runner` (Stop hook) · `markdown` · `selfcontained` (HTML) ·
`lifecycle` · `installer` · `dates` · `template` · `spec-derive` (Spec Kit → kanban state).

## Principles

- **Shared plumbing, domain-specific content** — plugins share the chassis, not their vocabularies.
- **Phase-separated skills** that know nothing of each other; they compose through files + gates.
- **Plant a project `CLAUDE.md`** — a plugin has no always-on slot, so it installs one.
- **Gates enforce "status can't exceed proven artifacts."**
- **Handoffs** ride a shared transport (gitignored `.handoff/` payloads, evidence in tracked
  state); payload schemas stay plugin-specific.

## Docs

- [`docs/skill-patterns.md`](docs/skill-patterns.md) — how to author a plugin/skill in this suite
  (the shared patterns; read before adding a plugin).
- [`docs/handoff-protocol.md`](docs/handoff-protocol.md) — the inter-plugin handoff transport.

## Install (once built)

```
/plugin marketplace add ~/Claude/Code/praxis
/plugin install research@praxis
/plugin install grounding-wiki@praxis
/plugin install educate@praxis
/plugin install build@praxis
/plugin install codebase-to-course@praxis
/plugin install spec-bridge@praxis
```

Each plugin is independently installable — take only the legs of the loop you need.
