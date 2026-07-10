# praxis — repo orientation

A Claude Code **plugin marketplace** unifying composable knowledge-work plugins on one shared
Node chassis (`lib/`). The plugins form a **research → teach → build** loop; each is
independently installable, mutually aware, and composes only through files + gates — never by
calling each other directly. See `README.md` for the full picture.

**Guiding principles:** shared plumbing but domain-specific content · phase-separated skills ·
plant a project `CLAUDE.md` (plugins have no always-on slot) · gates enforce "status can't
exceed proven artifacts" · handoffs ride a shared transport (gitignored `.handoff/`) with
evidence in tracked state.

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

## How praxis uses Backlog.md (the working flow)

Backlog.md **is** praxis's todo/kanban. Every unit of committed work is a task; the board is the
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
   commit. (`backlog instructions task-finalization` is the full checklist.)
5. **Scope discipline** — discovered out-of-scope work: stop and ask; never silently expand a
   task. Follow-up tasks need approval before creation.
6. **Subtasks one at a time** — each gets its own plan, notes, checked ACs, and final summary.
7. **Never hand-edit** Backlog markdown — always the `backlog` CLI, so metadata/relationships stay
   consistent.

**Commit rule (commit often):** commit at every meaningful slice — at minimum once per checked
acceptance criterion, and always when a task hits `Done`. Small, frequent commits. Subject line
leads with the task id, e.g. `TASK-1.2: extract project-root + gate-runner into lib/`. End every
commit message with the `Co-Authored-By: Claude …` trailer.

**Branching:** the repo has a remote (`origin` → `github.com:evanstern/praxis.git`) and uses a PR
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
