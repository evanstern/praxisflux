---
name: overview
description: What praxisflux is — a Claude Code plugin marketplace on one shared Node chassis whose plugins form a research → teach → build loop composing only through files and gates
kind: concept
sources:
  - README.md
  - CLAUDE.md
verified_against: b1cf2bdba3352713cd6b5b0b5f3b815efdee5751
---

# praxisflux — system overview

praxisflux is a Claude Code **plugin marketplace** that unifies composable knowledge-work
plugins on one shared, zero-dependency Node chassis (`lib/`). Nine plugins are registered
in `.claude-plugin/marketplace.json`: `research`, `grounding-wiki`, `educate`, `build`,
`codebase-to-course`, `spec-bridge`, `pdlc`, `team-review`, `reorient`. Each is
independently installable and mutually aware, but plugins never call each other — they
compose only through files and gates.

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
  (`docs/wiki/`, this corpus).
- [[educate-plugin]] teaches from that grounding and authors a build SPEC.
- [[build-plugin]] implements the SPEC and returns findings for the lesson to fold in.
- [[codebase-to-course-plugin]] consumes a grounded corpus to produce an interactive course.
- [[spec-bridge-plugin]] sits beside the loop: the Backlog.md board as a derived kanban view
  over GitHub Spec Kit specs, gated so status can't exceed proven artifacts.
- [[pdlc-plugin]] is the suite-level installer plus the lifecycle's own orchestrator, across
  four skills: `bootstrap` stamps a project (tracked, or **local-only** for a guest repo) with
  the planted CLAUDE.md grounding and the peer opt-ins; `design-rounds` owns the pre-spec seam
  where the deliverable is unknowable until an operator picks among options; `sweep` runs a set
  of board tasks through the whole lifecycle (operator-signed-off runbook, parallel lanes,
  serial merges); `refactor-triage` closes the post-sweep loop, carding accepted debt and
  drift findings back onto the board.
- [[team-review-plugin]] also sits beside it: a lead-plus-subagent architecture review of
  any caller-named codebase, read-only by doctrine, proven by an output gate (report
  sections + resolving citations + target untouched).

Knowledge interchange rides one contract, the grounded corpus ([[grounded-corpus-spec]]);
work interchange one transport, the handoff protocol ([[handoff-protocol]]).

Placement differs per plugin: `research` is drop-anywhere (sentinel-marked folders),
`educate` has a favored home folder (a `topics/` marker), `grounding-wiki` and
`codebase-to-course` run against a target codebase, and `team-review` is the
caller-supplied-target shape — reviewing a repo the caller names while keeping state at the
invoking root.

## Connections

- [[chassis]] — the shared plumbing every plugin reaches through its committed `lib` symlink.
- [[skill-patterns]] — the authoring conventions that make the plugins look alike.
- [[gates-convention]] — how gates keep each status backed by proven artifacts.
- [[build-and-release]] — how the marketplace and self-contained plugin packages are made,
  and the CI consumption surface: other repos run the gates via the composite action or
  the `@praxisflux/gates` npm package (`docs/consuming-gates.md` has both invocations).

## Operational notes

- Work is tracked in Backlog.md (`backlog task list --plain`); the board is the plan of
  record, statuses flow To Do → In Progress → Done, and every unit of committed work is a
  task. Courses are opt-in via a standing per-project choice (per-task | per-feature |
  none); praxisflux's is **per-feature** — a course per shipped feature on request,
  snapshot-exempt from freshness (`docs/task-courses.md`).
- The repo uses a PR flow: per-task branches pushed to `origin`
  (`github.com:evanstern/praxisflux.git`), merged into `main` via `gh` — with merge commits,
  never squash, so `verified_against` pins stay reachable. Each branch is checked out in a
  **worktree** under the gitignored `.worktrees/`, never by switching the root checkout: the
  root stays on `main` as the shared read surface every session reads the board, `specs/`, and
  `docs/wiki/` from (`CLAUDE.md`, "Worktree discipline").
- Releases are automated: a PR touching released surface (plugin dirs, `lib/`, `scripts/`,
  `.claude-plugin/`) must bump the marketplace version — and any edited skill's `version:` —
  per `docs/releasing.md`; CI enforces it, and each merge to `main` auto-publishes
  `v<version>` (see [[build-and-release]]). A bump also owes a **re-plant**: the planted
  block stamps the version, so it drifts by construction until re-planted in the same PR.
- Docs are load-bearing: every PR keeps `docs/wiki/`, `README.md`, and `CLAUDE.md` in sync
  with the code. Enforced by `scripts/check-docs.mjs` plus the wiki freshness gate, run in CI,
  the pre-commit/pre-push hooks, and a repo Stop hook (`scripts/stop-docs.mjs`) that refuses
  to end a turn while they fail.
- Install surfaces are public (the repo and the `@praxisflux/gates` npm package need no
  special access) and platform support is an explicit recorded decision: macOS/Linux
  supported, native Windows out of scope (the Stop-hook shims are bash and the committed
  `lib` symlinks assume `core.symlinks`; WSL works) — see README's Install section. The
  install path itself is CI-proven end to end (`test/install-path.test.mjs`).
- The flow also runs under external orchestration with humans only at the approval seam:
  `docs/headless-runner.md` (the agent-node recipe) and `docs/orchestration/` (the n8n
  pilot — workflow, host runner, run log, findings).
- The repo is itself PDLC-bootstrapped (dogfood): its own `CLAUDE.md` ends with the planted
  `pdlc:grounding` block (Backlog.md peer opted in; Spec Kit and Jira not, both recorded in
  `.pdlc`'s `peersOmitted` — specs are hand-authored), the sentinel records the plant and the
  version planted, `.handoff/` is gitignored, and its dispatch tiers ride the mechanism it
  ships (`.claude/model-tiers.json` → `tiers.mjs` → `.claude/agents/*`), including re-planting
  `--force` when the template moves ([[pdlc-grounding-block]]). CI now checks the plant
  (spec 066, [[release-pipeline]]) — added after this repo was found running a `v0.57.0` block
  against a `v0.63.1` marketplace: the check had always worked, but nothing invoked it.
- Foundational ("101") principles (`docs/principles.md`, the canonical statement, planted
  into every bootstrapped project by [[pdlc-plugin]], binding this repo too):
  **artifact-grounded action** — never act without a durable paper trail and/or gating on
  real physical evidence — and **one TASK, one PR** — a top-level task maps 1:1 to a PR;
  subtasks never get their own PR.
- Suite-design principles (`README.md`): shared plumbing but domain-specific content;
  phase-separated skills; plant a project `CLAUDE.md` (plugins have no always-on slot); gates
  enforce "status can't exceed proven artifacts"; handoffs ride a shared transport, evidence
  in tracked state.
- Enforcement is split by design (`README.md`, `CLAUDE.md`): local Stop hooks are
  advisory/opt-in — present only where a plugin is installed and `node` resolves — while CI
  (the composite action / `@praxisflux/gates`, see [[gates-consumption-surface]]) is
  authoritative: gates make dishonest status expensive locally and impossible in CI. The
  exceptions are [[pdlc-plugin]]'s **opt-in** `PreToolUse` hooks, which hard-block a tool
  call — off by default, so the split holds everywhere they are not adopted. The README
  plugin table's Enforcement column records each plugin's actual surface: Stop hook
  (research, educate, spec-bridge — which also has a CI gate — team-review, reorient),
  CLI/CI gate only (grounding-wiki, codebase-to-course), skill-only for the lifecycle
  (build; pdlc — plus those hooks).
