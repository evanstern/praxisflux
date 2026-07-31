# praxisflux — repo orientation

A Claude Code **plugin marketplace** unifying composable knowledge-work plugins on one shared
Node chassis (`lib/`). The plugins form a **research → teach → build** loop; each is
independently installable, mutually aware, and composes only through files + gates — never by
calling each other directly. See `README.md` for the full picture.

**Guiding principles:** shared plumbing but domain-specific content · phase-separated skills ·
plant a project `CLAUDE.md` (plugins have no always-on slot) · gates enforce "status can't
exceed proven artifacts" · handoffs ride a shared transport (gitignored `.handoff/`) with
evidence in tracked state. The foundational ("101") rules — **artifact-grounded action**
(never act without a durable paper trail and/or gating on real evidence) and **one TASK,
one PR** (subtasks never get their own PR) — are stated canonically in `docs/principles.md`
and bind this repo's own workflow too.

**Enforcement is split by design:** the Stop hooks plugins ship are advisory/opt-in — local
pressure while you work, never guaranteed present; CI (the composite action /
`@praxisflux/gates`, `docs/consuming-gates.md`) is the authoritative enforcement point.
Gates make dishonest status expensive locally and impossible in CI.

Authoring a plugin/skill? Read `docs/skill-patterns.md` (shared patterns) and
`docs/handoff-protocol.md` (inter-plugin handoffs) first.

Touching released surface (plugin dirs, `lib/`, `scripts/`, `.claude-plugin/`)? The PR must bump
the marketplace version — and any edited skill's own `version:` — per `docs/releasing.md`; CI
enforces it, and each merge to `main` auto-publishes the GitHub Release `v<version>`.

**Docs are load-bearing.** The grounding docs (`docs/wiki/`, `README.md`, `CLAUDE.md`) ground
spec-driven development here and matter as much as the code, so every PR keeps them in sync:
finish each PR with a `/grounding-wiki:wiki-update` pass when the freshness gate fails, and
update `README.md`/`CLAUDE.md` when what the repo ships changes. This is enforced, not
aspirational — CI, the pre-commit/pre-push hooks, and a repo Stop hook
(`scripts/stop-docs.mjs`) all run `scripts/check-docs.mjs` plus the wiki freshness gate, and
the Stop hook refuses to end a turn while they fail.

The work to build this out is tracked in Backlog (below). Start with `backlog task list --plain`.

## How praxisflux uses Backlog.md (the working flow)

Backlog.md **is** praxisflux's todo/kanban. Every unit of committed work is a task; the board is the
plan of record. Statuses flow **To Do → In Progress → Done**. Per task:

1. **Pick** — respect dependencies (only start a task whose deps are `Done`).
   `backlog task list --plain` → `backlog task view TASK-x --plain`.
2. **Start** — `backlog task edit TASK-x -s "In Progress" -a @claude`. Draft an implementation
   plan and record it: `backlog task edit TASK-x --plan "1. …"`. Present the plan first when
   approval is expected.
3. **Work in short loops** — implement a focused slice → run checks → record progress
   (`--append-notes`) → tick criteria as they come true (`--check-ac <n>`). **Commit after each
   meaningful slice** (see commit rule below).
4. **Finalize** — all ACs checked + DoD checked, write `--final-summary`, set `-s "Done"`, and
   commit. (`backlog instructions task-finalization` is the full checklist.) Courses are
   opt-in, not per-task — praxisflux's standing choice is **per-feature**, a course per
   shipped feature on request (`docs/task-courses.md`).
5. **Scope discipline** — discovered out-of-scope work: stop and ask; never silently expand a
   task. Follow-up tasks need approval before creation.
6. **Subtasks one at a time** — each gets its own plan, notes, checked ACs, and final summary.
7. **Never hand-edit** Backlog markdown — always the `backlog` CLI, so metadata/relationships stay
   consistent.

**Commit rule (commit often):** commit at every meaningful slice — at minimum once per checked
acceptance criterion, and always when a task hits `Done`. Small, frequent commits. Subject line
leads with the task id, e.g. `TASK-1.2: extract project-root + gate-runner into lib/`. End every
commit message with the `Co-Authored-By: Claude …` trailer.

**Branching:** the repo has a remote (`origin` → `github.com:evanstern/praxisflux.git`) and uses a PR
flow. Do the work on a per-task branch (e.g. `task-3-corpus-wiki`), commit often per the rule above,
push to `origin`, and open a PR with `gh` for review/merge into `main` — don't push straight to
`main`. **Merge with merge commits, never squash** — squashing orphans the commits that
`docs/wiki` notes pin as `verified_against`, breaking the freshness gate. End PR bodies with
the `🤖 Generated with Claude Code` trailer.

<!-- BACKLOG.MD GUIDELINES START -->
<CRITICAL_INSTRUCTION>

## Backlog.md Workflow

This project uses Backlog.md for task and project management.

**For every user request in this project, run `backlog instructions overview` before answering or taking action.**

Use the overview to decide whether to search, read, create, or update Backlog tasks.

Use the detailed guides when needed:
- `backlog instructions task-creation` for creating or splitting tasks
- `backlog instructions task-execution` for planning and implementation workflow
- `backlog instructions task-finalization` for completion and handoff

Use `backlog <command> --help` before running unfamiliar commands. Help shows options, fields, and examples.

Do not edit Backlog task, draft, document, decision, or milestone markdown files directly. Use the `backlog` CLI so metadata, relationships, and history stay consistent.

</CRITICAL_INSTRUCTION>
<!-- BACKLOG.MD GUIDELINES END -->

<!-- pdlc:grounding BEGIN v0.45.0 — planted by pdlc:bootstrap; refreshed wholesale on update. Keep project-specific edits OUTSIDE this block. -->
# praxis — praxis development lifecycle (PDLC)

This project is developed with the **praxisflux** plugin suite. This block is the always-on
grounding: it names the loop, each plugin's role, and the rules that hold between them. The
procedures live in the plugins' skills (lazy-loaded); this block makes the rules apply even
when no skill has triggered.

## The loop

Ground the codebase → plan as specs → build → re-ground → teach/render:

```
grounding-wiki (docs/wiki) ──corpus──▶ codebase-to-course (docs/course)
        │
        └─grounding─▶ spec/plan ──▶ build ──▶ wiki-update (re-ground) ──▶ …
```

## Plugin roles (entry skills)

- **grounding-wiki** — the code-grounded corpus in `docs/wiki/`: per-concept notes pinned to
  the commit they were verified against. Build once with `/grounding-wiki:wiki-build`; after
  merging changes that touch files any note lists as sources, run `/grounding-wiki:wiki-update`.
- **codebase-to-course** — interactive single-page HTML course in `docs/course/`, for
  non-technical readers. Reads `docs/wiki/` as its primary input when present.
- **build** — implements a SPEC handed off through `.handoff/` (`/build:implement`) and
  returns findings to the producer.
- **research** — drop-anywhere cited-fact vaults (`research:research-vault` → `analyze-vault`
  → `vault-artifact`) for grounding external topics.
- **spec-bridge** — the kanban view over Spec Kit specs (see the Spec Kit block below, if
  opted in).
- **pdlc** — the lifecycle's own verbs: `pdlc:bootstrap` (re)stamps this grounding after
  plugin upgrades; `/pdlc:sweep` orchestrates a set of board tasks through the whole loop —
  an authored, operator-signed-off runbook, then spec → PR → merge → re-ground per task,
  parallel lanes with serial merges; `/pdlc:refactor-triage` closes the loop after a sweep —
  evaluate the merged work for debt and drift, triage every finding with the operator, and
  card accepted items back onto the board as sweepable tasks.

## Rules that always hold

- **Artifact-grounded action:** never do anything without leaving a durable paper trail
  and/or gating against real physical evidence in the project — a file, a git commit, a
  task/issue. Artifacts that survive for human review are the only currency of state and
  decision: a choice living only in a chat turn, or a commitment left as prose where its
  durable home is the tracker, did not happen. Decisions are derived FROM artifacts and
  produce NEW artifacts; a question an existing artifact or principle already answers is
  resolved from it, not re-asked as a preference.
- **One TASK, one PR:** a TASK is a top-level deliverable and maps 1:1 to a pull request —
  one task, one branch, one PR. An EPIC (whatever the task system calls it) groups
  deliverable TASKs and gets no PR of its own; a SUBTASK is internal work breakdown and
  never gets its own PR: subtasks land as commits on the parent TASK's single branch and
  merge together in that TASK's one PR. A PR exists only where it carries a stated reason
  for a human to approve (a policy ratified, a posture changed, a contract made binding) —
  never a diff for its own sake; work too small to give a reviewer a real decision merges
  into the deliverable it serves.
- **Gates:** a status can never exceed the artifacts that prove it. Enforcement is
  per-plugin: spec-bridge, educate, research, reorient, and team-review ship Stop hooks;
  grounding-wiki's freshness gate runs as check scripts and CI, not a hook. When a gate
  blocks, produce the missing artifact — don't argue with the gate or edit derived state
  by hand.
- **Handoffs:** plugins compose only through files + gates, never by calling each other.
  Payloads ride the gitignored `.handoff/` transport; evidence lives in tracked state.
- **Grounding freshness:** `docs/wiki/` is load-bearing, not decoration. Changes that touch
  pinned sources aren't done until the wiki is re-pinned (`/grounding-wiki:wiki-update`).
- **Corpus loading:** when a grounded corpus is present (`docs/wiki/` or similar), load its
  `INDEX.md` first and route; load notes just-in-time — never bulk-load the corpus.
  Whole-corpus orientation reads `CAPSULES.md` when it exists; without one, INDEX plus
  just-in-time notes.

<!-- pdlc:peer:backlog BEGIN -->
## Backlog.md — the board (officially supported peer)

Backlog.md is this project's kanban; the board is the plan of record. Statuses flow
**To Do → In Progress → Done**.

- Start from `backlog task list --plain`; read a task with `backlog task view TASK-x --plain`.
- Record plans (`--plan`), progress (`--append-notes`), and tick acceptance criteria
  (`--check-ac <n>`) as they come true; finish with `--final-summary` and `-s Done`.
- **One task, one PR:** a top-level TASK gets one branch and one PR. Dotted-id subtasks
  (TASK-x.y) are internal breakdown — they ride the parent task's branch and merge in its
  PR, never their own.
- **Never hand-edit** files under `backlog/` — always the `backlog` CLI, so metadata and
  relationships stay consistent.
<!-- pdlc:peer:backlog END -->

<!-- pdlc:grounding END -->



