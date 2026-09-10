# 062 — gate-runner: an explicitly-passed cwd must win over ambient CLAUDE_PROJECT_DIR

**Board task:** TASK-0122 · **Lane:** 2.5 (inserted by operator ruling 2026-09-09, runs
before Lane 3) · **Runbook:** `docs/design/jira-board-runbook.md`

Spec Kit is not installed on this host (`.specify/` absent); this spec is hand-authored
under the sweep's operator-signed escape line, per established precedent (specs 052–061).

## Problem

`lib/gate-runner.mjs:39` resolves the directory every gate is evaluated against as:

```js
const start = process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || cwd;
```

The ambient environment variable wins over **both** `input.cwd` and the explicit `{ cwd }`
option a caller passes. So any in-process caller that names a directory is silently
redirected whenever `CLAUDE_PROJECT_DIR` is set — which the Claude Code harness sets for
every hook invocation.

**The precedence is backwards on its merits.** An argument a caller passes explicitly is
more specific than an ambient environment variable. The env var's legitimate role is the
*fallback* for when no caller said otherwise — which is exactly its role in the real
Stop-hook path, where nobody passes a cwd.

### Evidence this is the defect, not a one-test problem

**Eight** test files already hand-work around this, each saving, deleting, and restoring
the variable: `install-path`, `spec-bridge`, `root-guard-hook`, `phase-status`, `pdlc`,
`team-review`, `reorient`, `board-provider-seam`. Two carry comments naming the hazard
verbatim ("evaluate() prefers it over the passed cwd"). Eight independent workarounds for
one precedence rule is the smell — and the next test to pass a cwd without knowing the
folklore fails the same way, **only under the hook**, where it is hardest to diagnose.

### How it presented (the nine-firing mystery)

The spec-bridge Stop gate reported `tests` red / exited 1 while `node --test` from a shell
exited 0 with 526/526. Tracked across **eight** sightings on TASK-119/TASK-0122 as an
unreproduced transient, with every externally-reachable candidate ruled out. It was never a
transient. The harness sets `CLAUDE_PROJECT_DIR`; the `node --test` child inherits it;
`board-provider-seam`'s DoD#6 test passes `{ cwd: p.root }` at a fixture holding a
deliberately malformed `.board/links.json`; `evaluate()` ignores that cwd and samples the
real repo, whose mirror is valid; nothing crashes; the assertion fails; the suite exits 1.
Green in every shell-reachable invocation, red only under the harness — hence unreproducible
from outside. Two sessions found this independently on 2026-09-09.

**Deterministic reproduction:** `CLAUDE_PROJECT_DIR=$PWD node --test` → 525 pass / 1 fail
(before `10ed971`). Unset: 526/526.

### What is already done — do NOT redo

- **`10ed971`** (on `main`, test-only, no version bump owed since `test/` is exempt) added
  the guard to `board-provider-seam`'s DoD#6 test. Verified 526/526 both ways. **That is a
  symptom patch**: the precedence is untouched.
- **TASK-119 AC#4 answered:** the orphaned `refactor-triage-2026-07-31` worktree (deleted
  2026-09-09) was NOT the cause — a firing came after its removal.
- **The instrumentation the original card asked for already ships:**
  `SPEC_BRIDGE_GATE_TRACE` (`bridge.mjs` `tracePath()` — note the name, not
  `SPEC_BRIDGE_TRACE`). Its JSONL is what caught `['node','--test']` at status 1 while every
  sibling gate returned 0. No new logging is needed.

## Requirements

- **R1 — Explicit wins.** An explicitly-passed `{ cwd }` takes precedence over
  `process.env.CLAUDE_PROJECT_DIR`. (AC#1)
- **R2 — The real hook path is unchanged.** With no cwd passed, the env var still wins over
  `process.cwd()`. This is safe to assert precisely: the only production caller,
  `lib/gate-runner.mjs:77` (`runStopHook`), passes **no** cwd — verified by enumerating every
  `evaluate(` call site in `lib/`, `scripts/`, `*/gates/`, `*/scripts/`. (AC#1)
- **R3 — `input.cwd` precedence decided deliberately and documented.** `input.cwd` is the
  hook's *own* report of where it fired, not a caller's argument. It must sit between the
  two, and the ordering must be stated in the contract comment at the top of
  `lib/gate-runner.mjs` so the next reader doesn't have to infer it. (AC#2)
- **R4 — Regression test with a decoy.** With `CLAUDE_PROJECT_DIR` set to a decoy directory,
  a gate given an explicit cwd resolves against the passed cwd, not the decoy. This test
  must fail against today's code. (AC#3)
- **R5 — Audit the eight guards.** Each is removed as redundant or kept for a stated
  reason. A guard kept without a reason is a guard nobody can retire later. (AC#4)
- **R6 — Suite passes BOTH ways**, with the variable set and unset. Only the former
  reproduces the original defect, so a one-way run proves nothing. (AC#5)
- **R7 — Released surface obligations.** `lib/gate-runner.mjs` is vendored into **nine**
  plugins by `scripts/sync-shared.mjs` (build, codebase-to-course, educate, grounding-wiki,
  pdlc, reorient, research, spec-bridge, team-review). Marketplace version bump per
  `docs/releasing.md`, vendored copies re-synced, and `docs/wiki` re-pinned for every note
  sourcing the file (~10, including `gate-runner.md`, `chassis.md`, `gates-convention.md`,
  and `CAPSULES.md`). (AC#6)

## Non-goals

- Changing what any gate *does*, or any gate's own resolver.
- Touching `bridge.mjs`'s gate-command execution, timeout, or caching.
- Re-deriving the root cause. It is found and recorded; this spec implements the fix.

## Definition of done

All six ACs on TASK-0122 checked, suite green both ways, all three required project gates
exit 0, version bumped, vendored copies in sync, wiki re-pinned, one PR, merged as a merge
commit.
