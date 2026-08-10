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
Gates make dishonest status expensive locally and impossible in CI. The one hard-blocking
local surface is `pdlc`'s **opt-in root-guard `PreToolUse` hook** (spec 051): a host that
adopts worktree-only discipline can wire it to block root-checkout commits outside the
`backlog/` carve-out — but it stays **opt-in and planted**, never wired by default, so the
default posture above holds (advisory local, authoritative CI) for every host that has not
adopted it.

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

**Worktree discipline (where that branch is checked out):** **all branch work happens in a git
worktree** — never by switching the root checkout. Worktrees live under `<repo-root>/.worktrees/`
(gitignored), one per task: `git worktree add .worktrees/task-<n> -b task-<n>-<slug> origin/main`.
**The repo root checkout stays on `main`, clean and fast-forwarded** — it is the shared read surface
every session assumes: the board, `specs/`, and `docs/wiki/` are read from it, and a root sitting on
a feature branch silently serves stale state to every other session. Run `backlog`/`spec-bridge`
commands from the root when it is on `main`; when the root cannot carry the commit (protected `main`,
a background job), run them inside the task worktree and let the board edits ride that task's branch.
Remove the worktree and delete the branch only after verifying the PR merged (`gh api … --jq .merged`).

*If you find the root off `main`:* switch it back (`git switch main`) before doing anything else, and
**never strand commits on a branch you don't own** — if work already landed on a foreign branch, move
it to its own branch off `origin/main` (cherry-pick) and restore that branch to where its owner left
it. This is not hypothetical: it is the 2026-08-01 finding that produced this rule.

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

<!-- pdlc:grounding BEGIN v0.55.0 — planted by pdlc:bootstrap; refreshed wholesale on update. Keep project-specific edits OUTSIDE this block. -->
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
  parallel lanes with serial merges; `/pdlc:design-rounds` handles the task a sweep cannot
  start — work whose deliverable is not knowable until an operator has seen options and
  picked one (UI and visual design, competing layouts), running comparable rounds against a
  long-running worktree and ending with a decision record plus a spec written against the
  choice; `/pdlc:refactor-triage` closes the loop after a sweep — evaluate the merged work
  for debt and drift, triage every finding with the operator, and card accepted items back
  onto the board as sweepable tasks.

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

## Model tiers — who does what work

A sweep dispatches each task's implementation to a subagent; which model that subagent runs
on drives both cost and quality. **The posture: thinking is Opus/Fable-tier, execution is
Sonnet/Haiku-tier.** The orchestrator plans, gates, and judges at the top of the ladder; the
work of implementing a written spec runs at the cheapest tier that can hold it. An escalation
tier exists for tasks whose judgment calls the spec does not already settle — reaching for it
is an operator checkpoint, not an implementer's own call.

**Where the ladder lives: `.claude/model-tiers.json`.** That file — not this block — declares
the tiers, their model IDs, their scopes, and which one is the default. It is a plain tracked
file **outside every marker**: bumping a model ID or adding a tier is a one-line edit, no
drift, no `--force`, no re-plant. Model families rev on independent cadences and new ones
arrive unannounced, so the tier map is deliberately open — a tier this doctrine never
anticipated is a config key, not a code change.

```
.claude/model-tiers.json  →  pdlc/scripts/tiers.mjs  →  .claude/agents/*.md  →  harness
       (you edit)              (regenerates)              (generated — do not edit)
```

Regenerate after every config edit: `node <pdlc>/scripts/tiers.mjs --root .` (`--check` exits
nonzero when a definition is stale, which is what CI and a sweep's precondition gate run).

**Write the model ID in the form THIS host accepts.** There is no universal spelling. A
plain Claude Code install takes the bare API ID (`claude-sonnet-5`) or an alias (`sonnet`); a
host behind a routing proxy may require its own augmented form (e.g. `cc/claude-sonnet-5[1m]`),
and on such a host the bare ID and the alias are both **rejected**. Resolve your host's form
once — the `ANTHROPIC_DEFAULT_*_MODEL` env values are a strong hint, and a one-off dispatch
proves it — then write that form in the config. This is precisely why the ladder is host
config and not plugin doctrine: the right ID depends on where you are running.

**How a tier is pinned — two mechanisms, neither assumed.** The pin can reach the harness
through the agent definition's frontmatter (`.claude/agents/<tier>-implementer.md`,
`model: <id>`) or through the dispatch call's `model` parameter. **Both have been observed
failing, on different hosts:** on 2026-07-31 the dispatch-call parameter was silently ignored
and dispatches ran on the orchestrator's session model at ~2× the unit price
(`docs/design/board-cost-test-runbook.md`, TASK-74 row); on 2026-08-10 the reverse — the
frontmatter pin rejected an ID the dispatch parameter resolved fine. Prefer the frontmatter
pin, because it is durable across sessions where the parameter is per-call, and pass the
parameter too where it works. But **treat neither as proof.** The load-bearing rule is the
one below.

**Verify the served model; never infer it.** A green `--check` proves the file says Sonnet,
not that Sonnet ran. Confirm the model that actually served from the first dispatch's
transcript before launching siblings — a wrong pin caught after one agent is a rounding
error; caught after a lane of them, it is the whole lane's budget.

**Regenerating is not enough — the agent registry is read at session start.** A newly
generated definition is invisible to dispatch until the session restarts, and an edited one
keeps dispatching its *old* pin (observed 2026-08-10: a new tier reported "agent type not
found" while an existing tier dispatched with its pre-regeneration model). After a config
edit: regenerate, then **restart the session** before trusting any dispatch.

**Which one is authoritative.** This section is the **planted default** — posture and
mechanism, refreshed wholesale when you re-run `pdlc:bootstrap`. The agent definition's
`model:` is **authoritative at dispatch**: it is the model that actually runs. The config is
what you edit; the generated definition is what holds. Never hand-edit a generated definition
— the generator reports it as `drifted` and refuses to overwrite it without `--force`, so a
hand edit silently decouples the pin from the config until someone runs `--check`.

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
- **Two-track landing:** board/bookkeeping commits (cards, status flips, notes, AC ticks)
  land direct on the default branch; deliverable work lands by PR. This is one-task-one-PR
  applied, not an exception to it — a PR exists only where it carries a stated reason for a
  human to approve, and a board card carries no such decision. Where main-push is
  unavailable (background jobs, protected `main`), the board track degrades to riding the
  next task branch or a wrap-up PR.
- **Never hand-edit** files under `backlog/` — always the `backlog` CLI, so metadata and
  relationships stay consistent.
<!-- pdlc:peer:backlog END -->

<!-- pdlc:grounding END -->







