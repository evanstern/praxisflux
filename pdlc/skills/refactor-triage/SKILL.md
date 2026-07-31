---
name: refactor-triage
version: 0.3.0
description: Evaluate a body of merged work — a post-sweep commit range or the whole repo — for tech debt and intent drift, triage every finding with the operator (accept / reject / defer, rationale recorded), and execute accepted findings onto the Backlog board as cited, labeled, immediately sweepable debt tasks. Use when the user wants to "triage the merged work", "evaluate for tech debt", "card the debt", run a "post-sweep review" or "refactor triage", asks what debt or drift a sweep left behind, or a harness invokes it headless with a scope plus a declared triage policy. Orchestrates team-review:team-review as the evaluation engine when installed (inline eval pass when absent); team-review itself is unchanged.
---

# pdlc:refactor-triage — evaluate merged work, card the debt

This skill closes the seam nothing else owns: after a sweep merges a body of work (and
periodically between sweeps), someone must evaluate the merged result for tech debt and
drift, triage what's worth fixing, and land the accepted items back on the board as
sweepable tasks — **sweep → refactor-triage → debt tasks → next sweep**. It lives in pdlc
because pdlc is the orchestrator plugin, the only place where invoking sibling skills
(`team-review:team-review`, the `backlog` CLI) is architecturally allowed — domain plugins
compose only through files + gates. team-review is **unchanged** and serves as the
evaluation engine as-is: its lens parameter already carries arbitrary framing, so the
range and the drift focus ride in through the lens.

Two artifacts of record, both tracked: the **evaluation report** (team-review's, or this
skill's own inline one) and the **triage record** — every finding's disposition with its
rationale, written so the next run never re-litigates a decision already made.

## What it does NOT do

- It does **not change team-review.** No commit-range mechanics on its scripts, no new
  parameters — the lens carries everything. (Range-aware `orient.mjs` is a possible
  evidence-backed follow-up, not this skill's job.)
- It does **not split evaluation from triage.** One skill, four phases; eval-only runs
  are not a mode.
- It does **not fix anything.** Accepted findings become board tasks; the fixes are the
  next sweep's work. A triage run that starts implementing has left its phase.

## Precondition gate

1. **A git repo.** Findings are evidence-backed — file:line against real commits — and
   range mode diffs real history. Not a repo → stop.
2. **A `backlog/` board.** No board → nothing to execute accepted findings onto: STOP and
   name what must run first (`pdlc:bootstrap` with the Backlog.md peer, or `backlog init`).
   Evaluating without a board to card onto produces status no artifact can carry.
3. **Range mode:** the range must resolve — verify with git
   (`git rev-list --count <from>..<to>`) before proceeding; an unresolvable range is a
   stop, not a silent fallback to whole-repo. Post-sweep, the intent record is expected
   to exist: the sweep's runbook under `docs/design/`, each merged PR's spec under
   `specs/`, and the pinned `docs/wiki/` notes. Name whichever pieces are missing —
   Phase 2's intent-drift pass degrades per piece, but only declaredly.

## Phase 1 — SCOPE

Four entry modes decide what gets evaluated and how dispositions get made:

- **(a) Range** — `--range xxx..yyy`. The post-sweep case: the range is the sweep's
  merged work, and the sweep runbook + merged PR specs exist as the intent record.
  Evaluation covers the code the range touched; range mode also unlocks the
  intent-drift pass (Phase 2).
- **(b) Whole-repo** — no range. The periodic case: evaluate the codebase as it stands.
- **(c) Headless / harness** — arguments carry the scope (a range or whole-repo) **plus a
  DECLARED triage policy** passed as `--policy "<accept|reject|defer rules>"` (e.g.
  `--policy "auto-accept severity ≥ high, defer the rest"`) in place of conversation.
  **Detection (headless vs operator):** a run is headless when the invocation carries
  `--policy` and no interactive operator is present to walk the findings; an interactive
  session with an operator is the default otherwise (a `--policy` supplied alongside a
  live operator seeds defaults but the operator still walks each finding). No policy
  declared and no operator → refuse to run headless; a harness that cannot state its
  policy gets an operator, not a guess. The policy MUST be recorded verbatim in the
  triage record — the record is the only place a later reader can learn how dispositions
  were made.
- **(d) Since last triage** — no explicit range: resolve the scope from history. Locate
  the newest triage record in `docs/reviews/` (by the run-id timestamp convention Phase 2
  defines), extract its `last-run-at` commit id (the machine-findable line every record
  carries — see Phase 3), and verify both `git rev-parse <id>` and that `<id>..HEAD`
  resolves. On success, scan `<id>..HEAD` as a range run (unlocking the intent-drift
  pass). On any failure — no prior record, no `last-run-at` line, or an unresolvable id
  (garbage-collected or malformed) — **STOP** with a clear message naming what is
  missing; never guess a range or fall back to whole-repo.

State the resolved scope and mode before evaluating; in range mode, list the intent
artifacts found.

## Phase 2 — EVALUATE

**When the team-review plugin is installed, orchestrate it** — invoke
`team-review:team-review` over the scope, passing the framing through its existing lens
parameter. Range mode lens: *"drift and tech debt since `<range>`; clobbered design
decisions, slap-dash conflict resolutions"*. Whole-repo mode frames the lens on debt:
hotspots, decay, what a maintainer would flag.

The evaluation report's tracked home is `docs/reviews/team-review-<run-id>.md`, where
**run-id** is team-review's run id when the engine ran, else `<repo>-<ISO-stamp>` minted
at triage start (degraded mode); the same run-id keys the triage record. **Verify the
tracked copy — do not assume it landed.** After the engine (or inline pass) finishes,
check that `docs/reviews/team-review-<run-id>.md` exists as a git-tracked file. Recent
team-review (copy-on-finish) lands it there on a self-review, but older engines strand
the proven report in the gitignored `.handoff/` transport; if no tracked copy is present,
copy the proven report to that path and commit it in the same slice. This check is
version-independent — it holds whatever engine version ran.

**When team-review is absent, degrade gracefully:** run an inline eval pass over the same
scope yourself — read the diff (range) or the load-bearing surfaces (whole-repo), hunt
debt and drift under the same framing — and write your findings to that same tracked
report home (`docs/reviews/team-review-<run-id>.md`); a degraded engine is declared,
never silent.

**Range mode additionally runs an intent-drift pass team-review cannot do:** diff the
range against the intent record —

- the **sweep runbook** (`docs/design/*-runbook.md`) that scoped the merged tasks,
- each merged PR's **spec** under `specs/`,
- the pinned **`docs/wiki/` notes whose sources the range touched.

Drift is merged code contradicting what those artifacts say was decided — a design
decision clobbered in a conflict resolution, a spec requirement quietly dropped, a wiki
note whose prose the merge made false without an amendment. Every finding — engine or
intent-drift — needs **file:line evidence**; a finding without a citation does not enter
triage.

## Phase 3 — TRIAGE

Walk **every** finding with the operator: **accept / reject / defer**, a one-line
rationale each. No batch verdicts, no silently dropped findings — a finding that got no
disposition is an unfinished triage. Dispositions are recorded so the next run never
re-litigates: before presenting a finding, check prior triage records for a matching
disposition and carry it forward as prior art (the operator can overturn it; the record
notes the overturn).

Write the **tracked triage record** to `docs/reviews/refactor-triage-<run-id>.md` —
run-id-keyed so same-day runs never collide (team-review's precedent) — carrying: the
scope and mode, the evaluation report's path, the policy (headless) or "operator walk"
(interactive), and one line per finding: disposition, rationale, and for accepted items
the board task it became. **Headless mode applies the declared policy instead of
conversation** and records the policy plus every per-finding disposition in the same
record — a headless run leaves the same paper trail an operator walk does.

**High-water mark (`last-run-at`).** The record MUST also carry, exactly once, a
machine-findable `last-run-at: <commit id>` line — a fixed-prefix line whose value is the
**full 40-char commit id the scan reached**: the resolved right endpoint of the scanned
range (`git rev-parse <range-end>`) in range mode, or HEAD at scan time
(`git rev-parse HEAD`) in whole-repo mode. It must be the full hash — short ids rot. This
is the durable high-water mark the Scope phase's "since last triage" entry (Phase 1)
extracts to scope `<id>..HEAD` for the next run.

## Phase 4 — EXECUTE

Each **accepted** finding becomes a backlog task **via the `backlog` CLI** — never
hand-edit board files. Every created task:

- **cites its finding** in the body: the evaluation report's path plus the file:line
  evidence, so the task is auditable back to what justified it;
- is **labeled** (e.g. `debt`) so later sweeps can scoop the set by label;
- **notes dependencies** (on other created tasks or existing board work) so it is
  immediately sweepable — a debt task nobody can pick up wasn't executed, it was parked.

Rejected and deferred items land in the triage record only — no board residue for a
"no". Record each created task's id in the triage record next to its finding.

## Output gate

Prose gate, the pdlc precedent — verify before declaring the triage done, and fix
what's missing rather than rounding up:

1. **No created task without a finding it cites.** Every task minted this run names the
   report path and file:line evidence in its body; a task that cites nothing gets its
   citation added or gets killed.
2. **No "triage done" without BOTH artifacts tracked on disk:** whenever an evaluation
   ran, its report must be a **git-tracked copy** at `docs/reviews/team-review-<run-id>.md`
   — not stranded in the gitignored `.handoff/` transport — AND the tracked triage record
   at `docs/reviews/refactor-triage-<run-id>.md`. A conversation about findings is not a
   triage; a report living only in `.handoff/` is not tracked and fails this gate.
3. **Every finding has a disposition** in the record, with rationale; headless runs show
   the declared policy verbatim.
4. The board reflects exactly the accepted set — `backlog task list --plain` shows each
   accepted finding's task, labeled and dependency-noted, and nothing else this run added.

Status can never exceed artifacts: what the report and the record don't carry, didn't
happen.

## Handing off

The board now carries the debt as sweepable tasks and the triage record the audit trail.
The natural next step is a **sweep over the new debt tasks** (`pdlc:sweep` over the
label or the task ids) — suggest it; don't start it.
