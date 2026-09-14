# 068 — Gate tracer: preserve the failure tail; stop leaking the trace var

**Board task:** TASK-0121
**Status:** specified
**Branch:** `task-0121-gate-tracer`

## Problem

TASK-119 (spec 061 R4) shipped opt-in gate tracing (`SPEC_BRIDGE_GATE_TRACE`) so that the
next firing of an unreproducible red `tests` verdict could be read from *inside* the Stop
hook. On its first real capture it worked — the record proved `roots` was exactly one and
that `node --test` genuinely exited 1, eliminating both standing hypotheses (TASK-10's
node-PATH gap, which would surface as ENOENT, and the orphan-tree multi-root theory).

The same record exposed two defects in the instrumentation itself. Both are TASK-119's own
residue, not pre-existing debt. Both are verified present at this branch's base
(`9f6b6af`).

### Defect A — the capture keeps the head, so it discards the answer

`capTrace` (`spec-bridge/gates/bridge.mjs:271-274`) slices the **first** `TRACE_CAP`
(4000) chars:

```js
return s.slice(0, TRACE_CAP) + `…[${s.length - TRACE_CAP} more bytes truncated]`;
```

`node --test` prints its failure summary and the failing-test block at the **end** of its
output. The captured record ended `…[59774 more bytes truncated]` — the one record that
finally caught a red threw away the part naming which test failed.

The 4000-char cap is correct and worth keeping (a full suite's output is ~64KB). The
diagnostic half is simply the tail, not the head.

### Defect B — the env var leaks into spawned gates, and the suite traces itself

`runGateCommand` (`bridge.mjs:176-182`) builds its child env as:

```js
env: { ...process.env, SPEC_BRIDGE_GATE_ACTIVE: "1" },
```

`SPEC_BRIDGE_GATE_TRACE` is inherited from `process.env`. So when a traced gate spawns
`node --test`, the suite inherits tracing and every in-suite `bridgeGate`/`checkBridge`
call appends to the operator's trace file. Of 50 records in the field capture, **49 were
the suite's own temp fixtures** (`/var/folders/.../spec-bridge-*`, `phase-status-proj-*`)
with `commands:[]`. One was a real gate invocation.

This is worse than noise: the diagnostic artifact is contaminated by the thing being
diagnosed, and the useful row is buried. It is also a plausible contributor to the
intermittent red itself — the suite's assertions were written assuming tracing is off.
R4's own "default path writes nothing" test explicitly deletes the var; the other
bridgeGate-touching tests do not.

## Scope

**In scope:** the two defects above, and regression tests proving each.

**Explicitly NOT in scope:** fixing the intermittent red itself. This spec does not claim
to. The red remains unreproduced from a shell even with the hook's exact environment
(both env vars set, the hook's actual node — homebrew v26.3.1, which the shim's
login-shell fallback resolves rather than the shell's volta v24.17.0 — run from the repo
root: 526/526 exit 0, four consecutive times). These two fixes are the **prerequisite**:
they make it possible to READ which test failed when it next happens.

## Requirements

**R1 — `capTrace` preserves the end of a captured stream.**
A capped capture must retain the tail, so a `node --test` failure summary survives the cap.
Head+tail with an elided middle is acceptable and preferred: the head carries the command
context, the tail carries the verdict. The truncation marker must say **which part was
dropped**, not merely how much — a reader must be able to tell an elided middle from a
dropped head.
Maps to: TASK-0121 AC#1.

**R2 — a spawned gate child does not inherit `SPEC_BRIDGE_GATE_TRACE`.**
`runGateCommand` must strip the variable from the child env, at the same place it sets
`SPEC_BRIDGE_GATE_ACTIVE`. A gate's child must never inherit tracing, so a traced gate run
cannot hand tracing to the suite it invokes.
Maps to: TASK-0121 AC#2.

**R3 — regression tests pin both.**
(a) A capped capture whose failure text sits in the last ~1000 chars still contains that
text. (b) A spawned gate child's env lacks `SPEC_BRIDGE_GATE_TRACE`. Both must be
*negative-controlled*: shown to fail when the behaviour regresses (see the Notes below —
this repo has a live card, TASK-118, about assertions that pass without pinning anything).
Maps to: TASK-0121 AC#3.

## Invariants that must survive

These are properties of the surrounding code that this change must not break. They are
load-bearing and were deliberate in spec 061 R4:

- **Verdict-neutral instrumentation.** Every trace write is wrapped in try/catch; a trace
  failure is swallowed and can never turn a green gate red or vice versa. Neither fix may
  introduce a throw on the verdict path.
- **Off by default costs nothing.** `SPEC_BRIDGE_GATE_TRACE` unset ⇒ `tracePath()` returns
  null ⇒ every call site is a single falsy check, never a write, never a spawn.
- **`SPEC_BRIDGE_GATE_ACTIVE` keeps being set** on the child. R2 removes one variable; it
  must not disturb the other, which is what tells a spawned gate it is running under the
  gate.
- **The cap stays.** R1 changes *which* 4000 chars survive, not the bound. An unbounded
  capture would put ~64KB per record into the trace file.
- **`error` classification is unchanged.** R1/R2 touch capture and env only; the
  `ETIMEDOUT` / `no exit status` / `exited N` branches at `bridge.mjs:197-203` keep their
  current semantics.

## Acceptance mapping

| Card AC | Requirement | Proven by |
|---|---|---|
| #1 capTrace preserves the END of a captured stream | R1 | R3(a) |
| #2 runGateCommand does not propagate the trace var | R2 | R3(b) |
| #3 Regression tests for both | R3 | the tests themselves, negative-controlled |

## Notes for the implementer

- `TRACE_CAP` is the total budget, not a per-half budget. If head+tail is chosen, the two
  halves together must not exceed it — do not silently double the record size.
- TASK-118 (live on the board, out of scope here) is about assertions in this very repo
  that read as if they pin a behaviour and do not. Its rule applies to R3 regardless:
  **an assertion pinning a behaviour must be shown to FAIL when that behaviour regresses,
  and the negative control must be shown to have actually broken the thing.** A control
  that silently no-ops looks identical to a real pass.
- This is released surface (`spec-bridge/`), so the PR owes a marketplace version bump and
  the spec-bridge skill's own `version:` if touched — see the runbook's gate list.
