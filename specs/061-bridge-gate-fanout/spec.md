# spec 061 — spec-bridge gate: collapse project-gate fan-out, label dirty-tree samples

**Board task:** TASK-119 · **Runbook:** `docs/design/bridge-gate-fanout-runbook.md`
(signed-off 2026-09-08) · **Tier:** `sonnet` (`cc/claude-sonnet-5[1m]`)

## Problem

The spec-bridge Stop hook has fired **seven** times against this repo (2026-09-08 and
before), each time emitting ~57 near-identical blocking findings. All seven were downstream
of a **single** red project gate — `tests`. One of the seven was a genuine test failure.
The other six were not.

Two independent defects produce that outcome.

### P1 — Fan-out: one red gate, N findings

`evaluateProjectGates` is called **once per Done-eligible linked spec** (`checkBridge`) and
once per ticked-box spec (`verifyBridge`), and returns one finding per non-green gate each
time. With ~57 Done-eligible specs on this board, one red `tests` gate yields ~57 findings.

They are indistinguishable in substance — each names a different spec's phase and ticked box,
and **none names the actual cause**. The reader is told "your ticked checkbox in spec 007
stands over a red gate" fifty-seven times, about specs merged months ago, none of them at
fault. The information content is one fact: *the `tests` gate is red.*

The cost is not cosmetic. Each firing cost real diagnosis time, and the count grows with the
spec count — this repo gains a spec dir per task, so the fan-out worsens monotonically.

Note that `memoizeRun` (spec 050 defect 2) already fixed the *execution* half of this: each
distinct gate command runs at most once per bridge invocation, shared across specs. The
*finding* was left per-spec. This spec finishes that job.

### P2 — Transient sampling: a dirty tree produces a false RED

The gate runs its declared commands (`node --test`, `check-docs`, `sync-version --check`)
at Stop time against **whatever the working tree happens to contain**. Observed causes across
the seven firings:

- **Rounds 1, 2, 4:** sampled a worktree holding an implementer's *uncommitted mid-dispatch*
  edits. The commit was fine; the sample was not.
- **Round 3:** a genuine failure (spec 054's sentinel guard vs spec 060's new field).
  Correctly reported — the one actionable firing.
- **Rounds 5, 6, 7:** unreproduced. See R4.

Rounds 1/2/4 are the mirror image of this repo's own **F6** finding — *"a gate run against a
dirty working tree proves nothing about the commit"* — which was recorded for false *greens*.
Here the same unsoundness produced false *reds*.

A gate that is wrong four-to-six times in seven trains its reader to skip it, which is the
precise inverse of what "status can't exceed proven artifacts" exists to achieve.

## Requirements

### R1 — One finding per red gate, naming the gate and the affected count

A single non-green project gate MUST produce exactly **one** blocking finding per bridge
invocation, regardless of how many linked specs are Done-eligible or ticked.

The finding MUST name:
- the gate (`name`) and its bucket (`required` / `redByConstruction`);
- why it is not green, preserving the existing honest distinction between red / could-not-run
  / timed-out (`gateReason`);
- **how many** ticked-phase specs are affected (the count, not the enumeration).

It MUST NOT enumerate per-spec phase/box witnesses. Per-spec witness detail is not
load-bearing for a project-wide gate — the gate is red for the repo, not for spec 007 — and a
reader who wants the per-spec view has `cli.mjs state <specDir>`.

**Both entry points collapse:** `checkBridge` and `verifyBridge`. That they "agree by
construction" via the shared evaluator is a stated property of spec 050; fixing one and not
the other would break it.

`verifyBridge` retains its bucket asymmetry: a Done-eligible spec is held to both buckets, a
mid-PR spec to `required` only. Collapsing MUST NOT change which gates run for which specs —
only how their failures are reported. A gate that is red for a Done-eligible spec but not
evaluated for mid-PR specs still yields exactly one finding.

### R2 — A dirty working tree yields a labeled, non-blocking verdict

When the project root's working tree is dirty, a non-green project gate MUST NOT block.
It MUST instead surface as a **labeled warning** stating that the sample was taken against a
dirty tree and therefore proves nothing about the commit.

Rationale, resolved from this repo's own F6 principle rather than from preference: a verdict
that proves nothing must not block. Silence is equally wrong — it would hide a genuine red —
so the verdict is *labeled*, not *dropped*. `lib/gate-runner.mjs` already carries the exact
seam: a `warnings` channel written to stderr on an exit-0 stop.

- Dirtiness is determined via `git status --porcelain` at the bridge root; non-empty = dirty.
- **Fail closed:** if dirtiness cannot be determined (not a repo, git missing, command
  error), treat the tree as **clean** — i.e. keep blocking. An undeterminable condition must
  never silently disarm the gate, consistent with `runGateCommand`'s existing contract that a
  command which cannot run is never green.
- A **clean** tree is unchanged: non-green gates block exactly as today.
- The dirty-tree label applies to gate findings only. Non-gate findings (`exceeds` verdicts,
  mirror staleness, provider evidence) are unaffected — they read committed board and spec
  artifacts, not a sampled tree.
- **Both entry points, and `verify` in particular** (orchestrator ruling, 2026-09-08, in
  answer to the Phase 2 implementer's flagged judgment call). Phase 2 scoped R2 to
  `checkBridge` (the Stop hook) because this requirement's prose and plan.md's design section
  both discuss that path; `verifyBridge` was left hard-blocking on a dirty sample. That
  reading is **overturned**: R2 says "a non-green project gate MUST NOT block" without
  restricting the entry point, and `verify` exists precisely for **the mid-PR case — the
  window in which a tree is most likely to be dirty**. Leaving `verify` to hard-block on a
  sample that proves nothing reproduces P2 in the one place it is most likely to fire, and
  breaks the "agree by construction" property R1 preserves. `verifyBridge` returns a flat
  array (no warnings channel), so the shape question is real: it MUST NOT block on a
  dirty-tree gate verdict, and MUST surface the labeled verdict rather than dropping it
  silently — Phase 3 carries this as **T018a** with the mechanism left to the implementer
  (a `{problems, warnings}` return with `cli.mjs verify` updated to print warnings and exit
  0, or an equivalent that keeps the label visible). Silence is not an acceptable resolution;
  the label is the deliverable.

### R3 — Regression tests

Tests MUST pin both defects, with assertions that fail if the defect returns:

1. **Fan-out:** a red gate plus **N ≥ 2** Done-eligible linked specs yields exactly **one**
   finding, and that finding names the gate. A **negative control** is required: assert the
   count is 1 where the pre-fix behavior would have been N — an assertion that would pass
   under both behaviors proves nothing (this is TASK-118's convention, applied here
   deliberately).
2. **Dirty tree:** a dirty tree with a red gate yields a labeled non-blocking verdict rather
   than a bare blocking red; a clean tree with the same red gate still blocks.
3. **Fail-closed:** undeterminable dirtiness blocks (does not warn).
4. **No collateral change:** green gates still yield nothing; `exceeds`/`lags` verdicts and
   mirror findings are unchanged; the `SPEC_BRIDGE_GATE_ACTIVE` re-entrancy guard and its
   injected-`run` bypass (spec 050 defect 1) still hold — without that bypass this repo's own
   dogfood reddens its `tests` gate.

Tests inject `run` (no subprocesses) per the existing suite's pattern in
`test/project-gates.test.mjs`.

### R4 — Instrumentation for the unreproduced firings (record + instrument, not diagnose)

Rounds 5, 6, and 7 are **unreproduced**. AC #4 is satisfied by the record, which already
exists on the card: nine eliminations, each with the command run — dirty tree, real failure,
invalid manual reproduction (stdin), minimal non-login env, load-sensitive flake, gate
timeout, re-entrancy guard, `SPEC_BRIDGE_GATE_ACTIVE` on the child, and worktree cwd. A
faithful `runGateCommand` spawn replay returns status 0 against both trees.

This spec does **not** re-run that elimination sweep and does **not** promise a diagnosis.
It adds what the card itself names as the useful next step: **opt-in instrumentation** that
records, at Stop time, what the gate actually saw —

- the resolved **roots** (`resolveRoots`'s return), not just the exit code;
- per gate command: argv, cwd, exit status, signal, and captured stdout/stderr (bounded).

Constraints: **off by default** (a Stop hook must not write on every turn); enabled by an
env var; writes **outside the tracked tree**; never alters the gate's verdict.

Why roots specifically: round 7 found `.claude/worktrees/refactor-triage-2026-07-31/` — an
**orphaned** tree (its pointer references a repo location that no longer exists, so the
current repo has no registration for it) that carries its own `backlog/` and whose suite
exits 1. `findRootsDownwards`'s `defaultSkip` skips dot-dirs, so from either checkout the
resolver returns exactly one root — verified by calling it directly. The orphan is therefore
reachable **only** if some invocation starts its walk at `.claude/worktrees/` itself, where
neither child is dot-prefixed and both resolve as roots, one of them red. That is a
**candidate mechanism, not a confirmed cause**, and only in-hook instrumentation can settle
it — which is exactly why the deliverable is the instrumentation and not a claimed fix.

## Non-goals (explicitly out of scope)

- **Whether the Stop hook is the right place to run a ~45-second suite.** The card lists this
  as a suggested direction; **no acceptance criterion covers it**, it is a doctrine question
  about gate placement affecting every host that opts into `projectGates`, and moving or
  throttling the Stop-time run carries a different risk profile. Recorded in the runbook as
  out of scope, needing a new card. Scope discipline governs.
- **Removing the orphaned tree.** Operator-approved but independent of this deliverable.
- **The owed summary-style split of `docs/wiki/test-suite-catalog-plugins-gates.md`.**
  TASK-95 owns it (operator decision 2026-08-03).
- **TASK-117's mirror staleness.** Hit live during this task's own claim (a stale mirror made
  the freshly-marked card invisible to the gate); regenerating the mirror was necessary to
  claim at all, and the evidence is recorded in the claim commit. The *fix* is TASK-117's.

## Acceptance criteria (mapped to TASK-119's ACs)

| Card AC | Requirement | Met when |
|---|---|---|
| #1 — a single red project gate produces ONE finding naming that gate, not one per linked spec | R1 | One finding per red gate from both `checkBridge` and `verifyBridge`, naming gate + reason + affected count |
| #2 — the project-gate run either skips or explicitly labels its verdict when the tree is dirty | R2 | Dirty tree → labeled non-blocking warning; clean → unchanged; undeterminable → fails closed |
| #3 — regression test: red gate + N specs yields one finding, not N; dirty tree yields labeled/skipped verdict | R3 | Tests present and passing, with the negative control that distinguishes 1 from N |
| #4 — the unexplained round-5 firing is reproduced and explained, or explicitly recorded as unreproduced with what was ruled out | R4 | The card's record stands (nine eliminations); instrumentation shipped opt-in, logging roots + per-command capture |
