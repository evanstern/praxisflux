---
name: refactor-triage
version: 0.1.0
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

Three entry modes decide what gets evaluated and how dispositions get made:

- **(a) Range** — `--range xxx..yyy`. The post-sweep case: the range is the sweep's
  merged work, and the sweep runbook + merged PR specs exist as the intent record.
  Evaluation covers the code the range touched; range mode also unlocks the
  intent-drift pass (Phase 2).
- **(b) Whole-repo** — no range. The periodic case: evaluate the codebase as it stands.
- **(c) Headless / harness** — arguments carry the scope (a range or whole-repo) **plus a
  DECLARED triage policy** (e.g. "auto-accept severity ≥ high, defer the rest") in place
  of conversation. No policy declared → refuse to run headless; a harness that cannot
  state its policy gets an operator, not a guess. The policy MUST be recorded verbatim
  in the triage record — the record is the only place a later reader can learn how
  dispositions were made.

State the resolved scope and mode before evaluating; in range mode, list the intent
artifacts found.

## Phase 2 — EVALUATE

**When the team-review plugin is installed, orchestrate it** — invoke
`team-review:team-review` over the scope, passing the framing through its existing lens
parameter. Range mode lens: *"drift and tech debt since `<range>`; clobbered design
decisions, slap-dash conflict resolutions"*. Whole-repo mode frames the lens on debt:
hotspots, decay, what a maintainer would flag. On a self-review (the invoking project is
the target) team-review's output gate already lands the proven report at tracked
`docs/reviews/team-review-<run-id>.md` — that tracked copy is this skill's evaluation
report; commit it. **When team-review is absent, degrade gracefully:** run an inline eval
pass over the same scope yourself — read the diff (range) or the load-bearing surfaces
(whole-repo), hunt debt and drift under the same framing — and say so in the report; a
degraded engine is declared, never silent.

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
2. **No "triage done" without BOTH artifacts on disk:** the evaluation report AND the
   tracked triage record at `docs/reviews/refactor-triage-<run-id>.md`. A conversation
   about findings is not a triage.
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
