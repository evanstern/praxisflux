---
name: overview
description: What praxisflux is — a Claude Code plugin marketplace on one shared Node chassis whose plugins form a research → teach → build loop composing only through files and gates
kind: concept
sources:
  - README.md
  - CLAUDE.md
verified_against: 25cc22b0df24fc94b737a6afdcf304a9db0b1ffb
---

# praxisflux — system overview

praxisflux is a Claude Code **plugin marketplace** that unifies composable knowledge-work
plugins on one shared, zero-dependency Node chassis (`lib/`). Six plugins are registered
in `.claude-plugin/marketplace.json`: `research`, `grounding-wiki`, `educate`, `build`
(a scaffold), `codebase-to-course`, and `spec-bridge`. Each is independently installable and
mutually aware, but plugins never call each other — they compose only through files and gates.

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
- [[spec-bridge-plugin]] sits beside the loop: it makes the Backlog.md board a derived kanban
  view over GitHub Spec Kit specs, gated so status can't exceed proven spec artifacts.

Knowledge interchange rides one contract, the grounded corpus ([[grounded-corpus-spec]]);
work interchange rides one transport, the handoff protocol ([[handoff-protocol]]).

Placement differs per plugin: `research` is drop-anywhere (sentinel-marked folders),
`educate` has a favored home folder (a `topics/` marker), while `grounding-wiki` and
`codebase-to-course` run against a target codebase.

## Connections

- [[chassis]] — the shared plumbing every plugin reaches through its committed `lib` symlink.
- [[skill-patterns]] — the authoring conventions that make the plugins look alike.
- [[gates-convention]] — how gates keep every status backed by proven artifacts.
- [[build-and-release]] — how the marketplace and self-contained plugin packages are produced,
  and the CI consumption surface: other repos run the gates via the composite action
  (`uses: evanstern/praxisflux@v<version>`) or anywhere via the `@praxisflux/gates` npm package
  (`npx @praxisflux/gates`), see `docs/consuming-gates.md`.

## Operational notes

- Work is tracked in Backlog.md (`backlog task list --plain`); the board is the plan of
  record, statuses flow To Do → In Progress → Done, and every unit of committed work is a task.
  Finalizing a task also builds its **per-task course** at `docs/courses/TASK-XX/`
  (codebase-to-course scoped to that task's work, course-gated, riding the same PR —
  `docs/task-courses.md`).
- The repo uses a PR flow: per-task branches pushed to `origin`
  (`github.com:evanstern/praxisflux.git`), merged into `main` via `gh`.
- Releases are automated: a PR touching released surface (plugin dirs, `lib/`, `scripts/`,
  `.claude-plugin/`) must bump the marketplace version — and any edited skill's own
  `version:` — per `docs/releasing.md`; CI enforces it, and each merge to `main`
  auto-publishes the GitHub Release `v<version>` (see [[build-and-release]]).
- Docs are load-bearing: every PR keeps `docs/wiki/`, `README.md`, and `CLAUDE.md` in sync
  with the code. Enforced by `scripts/check-docs.mjs` plus the wiki freshness gate, run in
  CI, the pre-commit/pre-push hooks, and a repo Stop hook (`scripts/stop-docs.mjs`) that
  refuses to end a turn while they fail. PRs merge with merge commits, never squash —
  squashing would orphan the commits wiki notes pin.
- Guiding principles (from `README.md`): shared plumbing but domain-specific content;
  phase-separated skills; plant a project `CLAUDE.md` (plugins have no always-on slot);
  gates enforce "status can't exceed proven artifacts"; handoffs use a shared transport
  with evidence in tracked state.
