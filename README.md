# praxis

A Claude Code **plugin marketplace** that unifies a set of composable knowledge-work
plugins on one shared Node chassis. The plugins form a **research → teach → build** loop:
each is independently installable, aware of the others, and composes only through files +
gates — never by calling each other directly.

> Status: **under construction.** The plan lives in Backlog (`backlog task list --plain`).
> This repo is the unification target for the standalone `research` skills and the `educate`
> plugin.

## Plugins

| Plugin | Role | Placement |
|---|---|---|
| **research** | Gather cited facts into an isolated, interlinked Markdown "thinking vault" branch (EMBED → QUERY → RENDER). Neutral notes, then opinionated analysis, then an optional rendered page. | **Drop-anywhere** — a vault can live in any folder. |
| **educate** | Turn a folder into a Socratic learning project: teach, author a build SPEC, and gate each lesson `done` on auditable artifacts. | **Favored home folder** (detected via a `topics/` marker). |
| **build** | *(planned — split out of educate)* Implement a SPEC and return findings for the lesson to fold back in. | Runs where the work is. |

## The loop

```
research ──grounding──▶ educate ──SPEC──▶ build ──findings──▶ educate (revise)
 (ground)               (teach)           (implement)          (fold in)
```

## Shared chassis (`lib/`)

Zero-dependency Node modules vendored into each plugin at build time:
`project-root` · `gate-runner` (Stop hook) · `markdown` · `selfcontained` (HTML) ·
`lifecycle` · `installer` · `dates` · `template`.

## Principles

- **Shared plumbing, domain-specific content** — plugins share the chassis, not their vocabularies.
- **Phase-separated skills** that know nothing of each other; they compose through files + gates.
- **Plant a project `CLAUDE.md`** — a plugin has no always-on slot, so it installs one.
- **Gates enforce "status can't exceed proven artifacts."**
- **Handoffs** ride a shared transport (gitignored `.handoff/` payloads, evidence in tracked
  state); payload schemas stay plugin-specific.

## Install (once built)

```
/plugin marketplace add ~/Claude/Code/praxis
/plugin install educate@praxis
/plugin install research@praxis
```
