# Courses — docs/courses/ (opt-in, a standing project choice)

A course is a small interactive teaching artifact built with the codebase-to-course chrome
and scoped to one unit of shipped work: the question it answered, what was built, what was
learned. The pattern is borrowed from the-stacks, where it is standing practice.

**Why:** the board records *that* work happened, the wiki records *how the code now is*, and
git records *what changed* — but none of them teach. The course is the teaching artifact:
a self-contained, non-technical explanation of one unit of work, readable years later by
someone (or some agent) who wasn't there.

Courses are also the methodology's heaviest ceremony (~2MB of generated HTML each), so they
are **not** mandated per task. They are opt-in via a standing choice, below.

## The standing choice

Each project records **once** whether it wants courses, and at what grain:

- **`per-task`** — every completed task ships a course at `docs/courses/TASK-XX/`,
  authored on the task branch at finalization so it rides the same PR (task ↔ PR ↔ course
  stay 1:1).
- **`per-feature`** — one course per shipped feature (an epic, a sweep-scale deliverable),
  at `docs/courses/<feature-name>/`, named for the feature, built when the feature lands
  or on request. Individual tasks ship no course.
- **`none`** — no courses; the board, wiki, and git history are the record.

The choice is standing — made once, revisited deliberately, never re-asked per task or per
cycle. **Where the choice lives:** a `courses:` line in the project's PDLC grounding — for
pdlc-bootstrapped projects, the planted CLAUDE.md grounding block (this doc records the
convention; wiring the line into the bootstrap template is downstream work). For praxisflux
itself, the "Course policy" stanza below plus the matching line in the repo `CLAUDE.md`
workflow section (step 4).

## Course policy — praxisflux's standing choice

**per-feature.** praxisflux ships a course per shipped feature or sweep-scale deliverable,
on request — not per task. Recorded 2026-07-26 (TASK-41, the policy change itself);
`docs/courses/TASK-41/` is the last course built under the old per-task mandate.

## The convention (how a course is built)

- **Location:** `docs/courses/<name>/` — `TASK-XX` under per-task, the feature's name under
  per-feature (plural `courses` — the repo-wide course stays at `docs/course/`).
- **Scope:** the unit's work only, small by design — 2–4 modules. Sources: the task file(s)
  (description, notes, final summary), the PR diff, any docs the work produced, with the
  grounded corpus (`docs/wiki/`) for background concepts.
- **Build:** the codebase-to-course skill, chrome copied verbatim from the plugin's canonical
  `references/` (never from another course). Must pass the course gate before it ships:
  `node codebase-to-course/gates/cli.mjs course docs/courses/<name>`.
- **Decision-only closures ship no course** (relevant under per-task): a task whose entire
  deliverable is a recorded decision already teaches what happened through its record; a
  course about choosing not to build something is the convention consuming itself. (First
  instance: TASK-23, 2026-07-11.)
- **Headless-ready by construction:** building a course is itself a skill run with an output
  gate, so it slots into the orchestrated flow (`docs/headless-runner.md`) as one more
  agent node + gate node pair.

## Freshness: courses are snapshot-exempt

A course documents the work **as of merge time** and is never re-pinned or re-verified: the
course gate applies at **build time only**. This is deliberate and matches observed reality —
the gate checks the chrome version stamp, so every historical course fails the gate the day
the chrome generation bumps, and re-chroming old snapshots would be ceremony without a
consumer. Unlike wiki notes (which describe *how the code now is* and must stay fresh),
a course describes *what one unit of work was* — a claim that cannot go stale. This
resolves the chrome-fossil question this doc previously left open.

## The historical record

Courses at `docs/courses/TASK-XX/` exist for a **subset** of Done tasks — those built while
the old every-task mandate was in force (TASK-20, the pilot, through TASK-41). The opt-in
policy does not retroactively require courses for the uncovered tasks, and the existing
courses are kept, as snapshots, not deleted. No praxisflux doc should claim more coverage
than the artifacts prove.
