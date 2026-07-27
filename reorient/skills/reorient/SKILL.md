---
name: reorient
version: 0.5.0
description: Corpus-grounded reorientation of a project's direction — N parallel evaluator subagents each judge one research branch under a stated lens against the project's wiki and board, the operator steers between rounds, evaluators cross-ground each other, and the lead merges everything into one decisions-and-course-of-action synthesis that executes onto the board. Use when the user wants to "reorient" a project against research, "evaluate the vault branches against our purpose", "merge these analyses into a plan", "run the research → evaluate → synthesize loop", or asks what a body of research means for the roadmap — not for reviewing code (team-review) or gathering new research (research-vault).
---

# reorient — from grounded research to a re-planned board

You are the lead of a reorientation: take N already-gathered corpus branches, a **lens**
(the project's purpose statement), and the project's own grounding surfaces (wiki, board —
when present), and drive them through parallel evaluation, operator steering,
cross-grounding, and one synthesis that ends as concrete board moves. This skill owns the
**judging and merging** loop; it knows nothing about how the corpus was gathered (the
research plugin's EMBED phase) and never gathers research itself — if the corpus is
missing, stop and name that phase. It composes with siblings only through files: it reads
what research-vault produced and writes analyses/synthesis those plugins' gates can verify.

Helper scripts live in this plugin's base directory (`${CLAUDE_PLUGIN_ROOT}`). Every script
referenced here states an inline fallback — the skill still works hand-copied without them.
`gates/` only verifies and never writes; `scripts/run.mjs` is the only state writer. Run
records ride the gitignored `.handoff/reorient/runs/` transport at the **target project's
root** — the `<root>` each subcommand is given, never the directory you happen to invoke
from — so the run is visible to sessions (and their Stop gates) working in the target.
Transient plumbing; the durable residue is the analyses, the synthesis, and the board.

**Runs are session-owned.** `begin` stamps the manifest with the beginning session's
identity plus user@host provenance, and the owning session's Stop hook heartbeats it every
turn. The Stop gate nags **only the owner**; other sessions in the same checkout are never
blocked by someone else's run — at most they see a non-blocking "looks orphaned" notice
once the owner's heartbeat goes stale (>1h). `run.mjs list` shows owner, origin, and
heartbeat age, so live-vs-orphaned is read off the registry, never guessed. Adopting a run
begun elsewhere is always explicit: `run.mjs takeover <id>` (it prints who held the run,
from where, since when) — `abandon` refuses a run owned by another session until then.

**Runs are worktree-first — the default doctrine.** The run registry is shared mutable
state at the registry root — resolved from the TARGET root, so it is the target's
checkout that is judged, wherever you invoke from — and `begin` **refuses** to open a
run when that root is a shared primary checkout, detected deterministically: `.git`
there is a *directory* (a worktree carries a `gitdir:` file instead). Point runs at a
git worktree (`git worktree add .worktrees/<name> -b <branch>`) so the registry stays
lane-local; session ownership above is defense-in-depth, not isolation. The explicit
exception is the `--shared-checkout` flag: it permits the shared checkout, is recorded
on the run manifest (`sharedCheckout: true`), and is surfaced by `run.mjs list` and
owner provenance — use it only when the operator deliberately wants a checkout-wide run.

## Precondition gate — open the run

1. **Capture the lens.** The lens is the purpose statement every evaluation pressure-tests
   against (e.g. "this is a prompting-skills learning game that must be fun and
   addictive-in-a-good-way"). It usually comes from the user's request; if none is stated,
   propose one from the project's README/docs and get it confirmed — a reorientation
   without a lens is just a book report.
2. **Select the corpus: one or more branches.** Prefer research-vault branches (dirs under
   a `.research-vault` root with `_grounding.md` + neutral notes); ad-hoc corpus dirs (any
   folder of source material) are accepted with degraded guarantees. If the needed corpus
   doesn't exist yet, STOP and hand off to the research plugin's EMBED phase
   (`research-vault`) first — gathering is not this skill's job. If a vault branch fails
   the research plugin's branch gate, have that fixed first.
3. **Detect the grounding surfaces** — all optional, each recorded: a project wiki
   (`docs/wiki/` of pinned notes), a Backlog board (`backlog/`, driven only via the
   `backlog` CLI). State plainly what's absent and how the run degrades: no wiki →
   evaluators ground against README/docs and say so; no board → "board moves" become a
   proposed-tasks list in the synthesis instead of CLI executions.
4. **Open the tracked run:**
   `node ${CLAUDE_PLUGIN_ROOT}/scripts/run.mjs begin <project-root> --lens "<lens>" --corpus <branch> [--corpus <branch> ...] [--synthesis <path>] [--shared-checkout]`
   Worktree-first (above): if `begin` refuses because the TARGET's registry root is a
   shared primary checkout, target a worktree (the refusal prints the recipe) or — only
   on a deliberate operator choice — re-run with `--shared-checkout`.
   The default synthesis path is `docs/design/reorient-<run-id>.md` under the project
   root — keyed by run id, never by date, so concurrent same-day runs can't collide on
   one output — and always OUTSIDE every corpus branch (vault isolation forbids the
   branches from holding the cross-branch connective tissue). `begin` records this
   session as the run's owner (pass `--session <id>` only when the harness doesn't
   export `$CLAUDE_CODE_SESSION_ID`) and prints a notice if another run is already in
   flight for the same root — read who owns it before proceeding. *Fallback if the
   script is missing:* note the lens, corpus list, detected surfaces, and synthesis path
   in a scratch file yourself and self-check the output gate's properties at the end.

## Phase 1 — lead orientation

Read the corpus briefs/groundings and skim the wiki's `CAPSULES.md` (or its `INDEX.md`
when no rollup exists) yourself before delegating —
you need an independent opinion strong enough to pressure-test what evaluators report,
and to spot the strategic tension the branches might each only half-see (in practice the
deepest finding is often a mismatch between the corpus's original framing and the lens).
Tell the user what you found and what team you're dispatching before you dispatch it.

## Phase 2 — evaluate ×N (parallel, read-only)

Spawn **one evaluator subagent per corpus branch, all in one message** (they run
concurrently in the background). Each evaluator prompt must include:

1. **Persona + ground rules**: "veteran <domain> analyst, STRICTLY READ-ONLY this round —
   do not modify, create, or delete files. You are a teammate, not a lead: do NOT invoke
   any review/analysis skills and do NOT spawn subagents — your final reply IS the
   deliverable."
2. **The lens, verbatim**, with the instruction to pressure-test everything against it —
   including the corpus's own framing ("where the branch's original brief conflicts with
   the lens, the lens wins; call out where the framing needs updating").
3. **The beat**: read ALL notes in its branch (`_grounding.md` is the cited
   source-of-truth); ground against the project wiki via its `CAPSULES.md` when present —
   the whole-corpus capsule view — loading a full note only for claims the report
   actually cites; absent a rollup, route from `INDEX.md` and load notes just-in-time
   (README/docs when no wiki at all); scan the board via `backlog task list --plain` /
   `task view` (skip when no board).
4. **The report structure** (dense, evidence-backed, ~1500 words):
   - **Verdict** — how well the project serves the lens, and the single biggest gap.
   - **Patterns that fit** — which corpus findings map onto WHICH existing pieces (cite
     notes, wiki pages, task ids). Why each serves the lens, not flattery.
   - **Patterns that conflict or need adaptation** under the lens.
   - **New ideas, ranked** — each names the existing pieces it builds on or is flagged
     new-subsystem; big swings in scope if the payoff is big.
   - **Updates to existing board items** — task ids and how their framing should change.
   - **Open questions for the operator** — sharp, answerable; these drive Phase 3.
5. Citation discipline: corpus note names + the grounding's sourced claims, wiki note
   names, task ids, file paths.

**No-subagent fallback:** run the evaluations sequentially yourself in-session, one branch
at a time, writing each draft to a scratch file before starting the next — never blend two
branches' evaluations in one pass.

Open A/B question — capsule-only vs full-note evaluator grounding quality is unmeasured;
the next reorient run should record which mode its evaluators used and any observed
quality difference (do not run the experiment as part of a reorientation).

## Phase 3 — steer (the operator is part of the loop)

Subagents cannot talk to the user, so steering is **checkpointed relay**, as many rounds
as needed:

- As each draft lands, give the user a short digest — verdict first. **Spot-check the
  boldest evidence claims** against the cited files/tasks before carrying them forward;
  refuting a plausible-but-wrong claim is worth telling the user about.
- Put the drafts' operator questions to the user as concrete decisions (recommendations
  first). Batch related decisions; don't drip.
- Relay answers back into the **same evaluator agents** (SendMessage — their context
  persists) as **fixed constraints, not open questions**: "decided: X; rework your
  ranking under it." Record every decision on a durable surface as it's made (board task
  comments, or the synthesis draft) — a decision living only in chat didn't happen.

## Phase 4 — cross-ground

When drafts have converged, send each evaluator its siblings' converged drafts (duplicated
inline — see isolation below) plus the full decision set, and have it:

- **Reconcile** into one coherent position with each sibling where they overlap or
  collide, adopting or rebutting explicitly; **name any conflict it cannot reconcile**
  rather than papering over it — unresolved tensions are synthesis input, not failures.
- **Write the durable analysis** into its own branch (write access to that branch ONLY):
  for vault branches, a `research`-plugin-conventional `Analysis-*.md` (`type: analysis`
  frontmatter, cites the corpus, records the decisions as given constraints, keeps
  genuinely-open questions open); for ad-hoc corpus, an `ANALYSIS.md` in the corpus dir.
- **Respect vault isolation absolutely**: no wikilinks across branches; the sibling is
  referenced in prose and whatever context is needed is duplicated. Earlier layers
  (grounding, briefs) are immutable — a superseded assumption is declared superseded in
  the analysis, never edited away.

Verify each branch afterward: for vault branches run the research plugin's gates if
available (`branch` + `analysis`); at minimum confirm the analysis file exists, its links
stay in-branch, and nothing outside the authorized branch changed (`git status`).

## Phase 5 — synthesize (the lead writes this, not an agent)

Write the synthesis to the run's synthesis path — the cross-branch connective tissue the
corpus branches must not hold. Selective over exhaustive; include a finding only if it
would change what the reader does next. Required sections (the gate checks them):

```
# <project> — reorientation synthesis (<date>)
**TL;DR** (or a Verdict section)      — the answer in a few sentences
## Decisions                          — every operator decision, numbered, verbatim intent
## <the merged positions>             — unified design positions incl. what each branch
                                        contributed; name every corpus branch by name
## Course of action                   — build-ordered waves, each item naming what it
                                        builds on; an explicit big-refactor assessment
                                        (necessary or not, and why)
## Board moves                        — a table of task changes + new tasks (required when
                                        a board was detected)
## Open questions                     — only decisions genuinely still the operator's
```

The synthesis must name every corpus branch (the gate refuses a "merge" that never
mentions a branch) and should record where each unresolved tension is parked so it
resurfaces at the right moment.

## Phase 6 — reorient and execute

Present the synthesis; get explicit sign-off on the board-move table (item-level approval
is fine). Then execute approved moves **via the board CLI only** — priorities, rescope
comments, new tasks with acceptance criteria, each pointing back at the synthesis. Beyond
the board, hand off rather than absorb: implementation goes through the host project's own
machinery (specs, implementer dispatch, its constitution). Commit the durable residue
(analyses, synthesis, board files) per the host project's conventions.

## Output gate — prove the run

`node ${CLAUDE_PLUGIN_ROOT}/scripts/run.mjs finish <run-id>` — verifies every declared
vault branch carries its analysis note, the synthesis exists outside the corpus with the
required sections (board section only when a board was detected), and every corpus branch
is named in it. If it blocks, **produce the missing artifact** — don't argue with the
gate. If the user cancels midway: `run.mjs abandon <run-id> <reason>` — abandon is
owner-only; for a run begun by another session, first `run.mjs takeover <run-id>`
(explicit adoption, provenance printed) and only after confirming with the user that the
run is genuinely orphaned (check `run.mjs list` heartbeat ages). *Fallback if the script
is missing:* self-check those properties by hand and say so.

## Handing off

What's now possible: the board carries the re-planned work (the host project's own flow
takes it from there); `analyze-vault`-conventional analyses sit in each branch for future
readers; the synthesis is render-ready if the user wants a briefing page
(`vault-artifact`), and any corpus gaps the evaluators flagged are ready-made briefs for
the next `research-vault` pass. Suggest — don't start — whichever the user's next move
implies.
