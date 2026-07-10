---
name: overview
description: What praxis is — a Claude Code plugin marketplace on one shared Node chassis whose plugins form a research → teach → build loop composing only through files and gates
kind: concept
sources:
  - README.md
  - CLAUDE.md
verified_against: 5934860e2021d1d3b096d3c6d7a30bf5d434c003
---

# praxis — system overview

praxis is a Claude Code **plugin marketplace** that unifies composable knowledge-work
plugins on one shared, zero-dependency Node chassis (`lib/`). Five plugins are registered
in `.claude-plugin/marketplace.json`: `research`, `grounding-wiki`, `educate`, `build`
(a scaffold), and `codebase-to-course`. Each is independently installable and mutually
aware, but plugins never call each other — they compose only through files and gates.

## How it works

The plugins form a **research → teach → build** loop with two grounding sources feeding it:

```
research (topics) ─┐
                   ├─grounding─▶ educate ──SPEC──▶ build ──findings──▶ educate (revise)
grounding-wiki ────┘             (teach)          (implement)          (fold in)
   (codebase)  └──corpus──▶ codebase-to-course (interactive course in docs/course/)
```

- [[research-plugin]] gathers cited facts on external topics into thinking-vault branches.
- [[grounding-wiki-plugin]] grounds a *codebase* as a corpus of commit-pinned notes
  (`docs/wiki/` — the corpus you are reading is one).
- [[educate-plugin]] teaches from that grounding and authors a build SPEC.
- [[build-plugin]] implements the SPEC and returns findings for the lesson to fold in.
- [[codebase-to-course-plugin]] consumes a grounded corpus to produce an interactive course.

Knowledge interchange rides one contract, the grounded corpus ([[grounded-corpus-spec]]);
work interchange rides one transport, the handoff protocol ([[handoff-protocol]]).

Placement differs per plugin: `research` is drop-anywhere (sentinel-marked folders),
`educate` has a favored home folder (a `topics/` marker), while `grounding-wiki` and
`codebase-to-course` run against a target codebase.

## Connections

- [[chassis]] — the shared plumbing every plugin vendors at build time.
- [[skill-patterns]] — the authoring conventions that make the plugins look alike.
- [[gates-convention]] — how gates keep every status backed by proven artifacts.
- [[build-and-release]] — how the marketplace and self-contained plugin packages are produced.

## Operational notes

- Work is tracked in Backlog.md (`backlog task list --plain`); the board is the plan of
  record, statuses flow To Do → In Progress → Done, and every unit of committed work is a task.
- The repo uses a PR flow: per-task branches pushed to `origin`
  (`github.com:evanstern/praxis.git`), merged into `main` via `gh`.
- Guiding principles (from `README.md`): shared plumbing but domain-specific content;
  phase-separated skills; plant a project `CLAUDE.md` (plugins have no always-on slot);
  gates enforce "status can't exceed proven artifacts"; handoffs use a shared transport
  with evidence in tracked state.
