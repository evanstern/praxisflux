# Spec 072 — the test suite runs once per CI run, not twice

**Task:** TASK-0132 · **Status:** draft · **Created:** 2026-09-14

## Problem

`.spec-bridge.json`'s `projectGates.required` declares
`{ "name": "tests", "command": ["node","--test"] }`. In CI, the `checks` job runs
`- name: tests` → `node --test` at `ci.yml:22-23`, and then the spec-bridge step at
`:34-35` runs the **entire suite again** as that gate. Two full runs per CI run.

**The cost is minor; the correctness consequence is not.** It is a **second independent roll
of the dice on any nondeterministic test.** That is exactly how the TASK-0130 flake (~5% per
run) blocked PR #144: the `tests` step passed 624/624 while the `tests` project gate, rolling
the same die again in the same job, came up red. A ~5% flake becomes ~10% per PR, and the
failure surfaces in the *less* diagnosable of the two places.

**Field evidence from this sweep (2026-09-14), which sharpens the point.** PR #151 failed CI on
the spec-bridge step. Because that step failed first, the standalone `wiki-freshness` step was
**skipped**, so the log named the gate and not the ten stale notes behind it — recovering the
list required fetching `refs/pull/151/merge` into a probe worktree. A gate that re-runs work
another step already did, and reports it less legibly, is strictly worse than the step it
duplicates.

## Premise correction (verified 2026-09-14 — the card's framing is wrong)

The card says "the `tests` job, then again as spec-bridge's `tests` project gate". **There is no
second job.** `.github/workflows/ci.yml` declares exactly **two** jobs — `checks` and
`install-path` — and *both* suite invocations are sequential **steps inside `checks`**
(`:22-23` and `:34-35`).

Consequences, since this is what makes two of the card's three directions inapplicable:

- "Have the CI spec-bridge step reuse the `tests` job's verdict (job dependency + status)" —
  **no job boundary exists** to depend on.
- "Order the jobs so a red `tests` short-circuits the `checks` job" — already true by
  construction: steps run in order and `checks` stops at the first failure. It buys nothing,
  because the duplicate invocation is *downstream* of the first, not parallel to it.

## The ruling this spec implements

**Operator ruling, 2026-09-14, recorded in `docs/design/full-board-sweep-runbook.md` as a gate
line before any dispatch: DROP THE REDUNDANT CI STEP, KEEP THE GATE ENTRY.**

The workflow's own `- name: tests` step is removed. spec-bridge's `tests` project-gate entry
becomes the single suite invocation in CI. No config change, no `projectGates` contract change,
no environment sniffing.

**Why the gate entry stays** (the card is explicit, and it is load-bearing): `projectGates`
enforces "a ticked `tasks.md` checkbox cannot outrun a red project gate", which is doctrine that
works correctly. The defect is the redundant *invocation* in CI, not the mechanism.

## Requirements

- **R1 — one run.** The full suite runs exactly ONCE per CI run, measured from the workflow
  logs rather than reasoned about. (AC#1)
- **R2 — enforcement survives in CI.** A genuinely red suite still fails the spec-bridge gate.
  **Proven by a deliberate red-suite run, not by argument** — this is the real work of the
  task, because removing the dedicated step means the gate is now the only thing standing
  between a red suite and a green CI run. (AC#2)
- **R3 — local paths untouched.** The Stop hook, pre-commit, and hand-run paths are unchanged.
  They never had a sibling step, so the gate entry is their only proof; removing a *CI* step
  cannot weaken them, and nothing in this change may alter them. (AC#3)
- **R4 — no inferred behaviour.** Satisfied by construction: this direction changes only the
  workflow's step list. There is no new config key and nothing sniffs the environment, which
  is precisely why it satisfies AC#4's "data the host states, not behavior inferred". (AC#4)
- **R5 — consumer contract.** `docs/consuming-gates.md` needs **no** behavioural change,
  because the `projectGates` contract is untouched. AC#5 is conditional ("if the `projectGates`
  contract is extended") and that condition is not met. This must be **stated and justified**
  rather than silently skipped. (AC#5)
- **R6 — the drift check stays honest.** `test/run-gates.test.mjs:35-44` asserts `ci.yml` still
  runs the repo's own **`spec-bridge`** and **`wiki-freshness`** self-checks. See the finding
  below: that assertion does **not** cover the `tests` step, so it does not block this change —
  but it must be re-read and left intact, since it exists because CI once had no spec-bridge
  step at all (spec 057's must-fix finding).

## Finding — the anticipated blocker is narrower than believed

The runbook's gate line warns that `test/run-gates.test.mjs` "asserts both CI steps stay
present, so it must be updated in the same PR — and carefully, since that assertion is
load-bearing history."

**Verified at HEAD: it does not assert the `tests` step.** The test (`:35-44`) loops over
`["spec-bridge", "wiki-freshness"]` and matches
`run:\s*node scripts/run-gates\.mjs --gates <gate> --path \.` — both are `run-gates.mjs`
self-checks, neither is `node --test`. So **removing the `tests` step does not touch this
assertion and it needs no update.** Recorded because the runbook told a future session to
expect an edit there; making a load-bearing assertion looser than it is would be the exact
failure TASK-118 is carded about.

## Non-goals

- Changing WHICH gates run, for which specs, or the `projectGates` bucket semantics.
- Touching `.spec-bridge.json` — the `tests` gate entry stays exactly as declared.
- Any change to local invocation paths (R3).
- CI retry or flake quarantine. The card raises them as context; they are separate concerns and
  a fix for them is not in scope here.
- Removing or weakening the `install-path` job's own `node --test test/install-path.test.mjs`
  (`:79`) — that is a single targeted file in a *different* job, deliberately run against a
  packaged install, not a duplicate of the full suite.

## Requirement → acceptance-criterion map

| AC | Requirement |
|----|-------------|
| #1 Suite runs ONCE per CI run, measured from logs | R1 |
| #2 Enforcement still holds in CI, proven by a deliberate red-suite run | R2 |
| #3 Local paths unchanged | R3 |
| #4 Host-stated config, not inferred behaviour | R4 |
| #5 Consumer contract doc records a contract change | R5 (condition not met — stated, not skipped) |

## Evidence at HEAD (verified 2026-09-14)

- `.github/workflows/ci.yml:12` — `jobs:` declares `checks` and `install-path`, two jobs only.
- `.github/workflows/ci.yml:22-23` — `- name: tests` / `run: node --test` (the step to remove).
- `.github/workflows/ci.yml:34-35` — the spec-bridge step that re-runs the suite via the gate.
- `.github/workflows/ci.yml:79` — `install-path`'s targeted single-file run (not in scope).
- `.spec-bridge.json` — the `tests` required-gate entry (stays).
- `test/run-gates.test.mjs:35-44` — the drift check; covers `spec-bridge` + `wiki-freshness`.
