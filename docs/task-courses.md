# Per-task courses — docs/courses/TASK-XX/

Every completed task (generally 1:1 with a merged PR) leaves behind a small interactive
course at `docs/courses/TASK-XX/`, built with the codebase-to-course chrome and scoped to
**just that task's work**: the question it answered, what was built, what was learned. The
pattern is borrowed from the-stacks, where it is already standing practice.

**Why:** the board records *that* work happened, the wiki records *how the code now is*, and
git records *what changed* — but none of them teach. The task course is the teaching artifact:
a self-contained, non-technical explanation of one unit of work, readable years later by
someone (or some agent) who wasn't there. It is the self-documentation loop closed at the
task level.

## The convention

- **Location:** `docs/courses/TASK-XX/` (plural `courses` — the repo-wide course stays at
  `docs/course/`). One directory per task, named for the task id.
- **Scope:** the task's work only, small by design — 2–4 modules. Sources: the task file
  (description, notes, final summary), the PR diff, any docs the task produced, with the
  grounded corpus (`docs/wiki/`) for background concepts.
- **Build:** the codebase-to-course skill, chrome copied verbatim from the plugin's canonical
  `references/` (never from another course). Must pass the course gate before it ships:
  `node codebase-to-course/gates/cli.mjs course docs/courses/TASK-XX`.
- **When:** authored on the task branch as part of finalization, so it rides the same PR as
  the work it describes (task ↔ PR ↔ course stay 1:1).
- **Exemption — decision-only closures.** A task whose entire deliverable is a recorded
  decision (a checkpoint closed with rationale in its notes, nothing built) ships no course:
  the decision record already teaches what happened, and a course about choosing not to
  build something is the convention consuming itself. The moment a decision task produces
  an artifact beyond its own record, the exemption ends. (First instance: TASK-23,
  2026-07-11.)
- **Headless-ready by construction:** building the course is itself a skill run with an
  output gate, so it slots into the orchestrated flow (`docs/headless-runner.md`) as one more
  agent node + gate node pair.

## The pilot (TASK-20)

`docs/courses/TASK-20/` — three modules (The Question / The Test Flights / What We Learned)
covering the headless-runner spike; passed the course gate on first build. Marginal cost of
authoring: one focused model pass over material already in context at finalization time —
cheapest exactly when the convention schedules it.

## Enforcement options (decision pending)

The convention can be held at three strengths; the open question is the **chrome-fossil
policy** — the course gate checks the chrome version stamp, so every historical course fails
the gate the day the chrome generation bumps:

1. **Convention only** (documented here + CLAUDE.md; no CI). Cheapest; relies on review
   culture. Risk: silently skipped under time pressure.
2. **CI loop, snapshots exempt from chrome currency** — CI runs the course gate over every
   `docs/courses/*/` but treats them as snapshots (skip or soften `checkChrome`). Keeps
   structural validity enforced without forcing eternal re-chroming. Needs a small gate
   option (e.g. `--chrome=snapshot`).
3. **CI loop, full gate, re-chrome sweep on bump** — historical courses are kept *live*: a
   chrome bump's recipe grows a mechanical sweep (copy chrome + `bash build.sh` per course
   dir). Most consistent with "docs are load-bearing"; ongoing cost scales with task count.

Recommendation: start at (1) — the convention costs nothing to document and the pilot proves
the flow — and revisit (2) vs (3) at the next chrome bump, when the fossil question stops
being hypothetical.
