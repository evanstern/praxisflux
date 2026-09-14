# Spec 069 — a failing required project gate reports its actual output

**Task:** TASK-0131 · **Status:** draft · **Created:** 2026-09-14

## Problem

`runGateCommand` (`spec-bridge/gates/bridge.mjs:177-209`) captures its subprocess's
`stdout` and `stderr` into memory and then returns a verdict that carries **neither**:

```js
return { ok: false, kind: "red", reason: `exited ${res.status}` };
```

`gateReason` (`:338-343`) turns that into `is red (exited 1)`, and
`collapsedGateProblems` (`:392-406`) emits the finding a session actually reads:

    [spec-bridge] the required gate "tests" is red (exited 1) — 65 linked specs affected.

The failure itself was in the gate's hands at that moment and was thrown away.

**Field case (2026-09-11, PR #144, CI run 34616221159).** The spec-bridge step failed with
exactly that line. Recovering the cause required a `gh run view --log` dig against a
*different* run to find the TAP output — which named the failing test, its file, its line,
and the ENOENT path (carded as TASK-0130). Every one of those facts had been captured and
dropped. Cost: a full diagnostic subagent run (~160k tokens) for information the gate
already held in a local variable.

**Why this is a defect and not a convenience gap.** `docs/wiki/gates-convention.md`
requires a failure line to NAME ITS FIX. `"tests" is red (exited 1)` names neither the
failure nor the fix — it is half a gate, the same defect shape as TASK-0125 (a gate whose
output cannot be acted on). Spec 066 added a remedy line to `plant --check` for this same
reason; this is the identical omission one layer over.

## Requirements

- **R1 — the excerpt reaches the finding.** A non-green `required` project gate's finding
  carries a bounded excerpt of the subprocess's real combined output, not only its exit
  code. (AC#1)
- **R2 — bounded.** The excerpt is length-capped so one failing suite cannot drown its own
  finding or the findings around it. `node --test` on this repo emits hundreds of lines;
  the cap is what makes the excerpt readable rather than a dump. (AC#2)
- **R3 — tail-preserving.** The cap keeps the END of the output. `node --test` prints its
  failure summary last, so a head-only excerpt reports the run's banner and discards the
  finding. This is the same constraint spec 068 R1 settled for `capTrace`, and the reason
  this task is sequenced after TASK-0121. (AC#1, AC#2)
- **R4 — the headline survives.** The existing one-line summary stays exactly as the
  headline; the excerpt is additional context appended to it, never a replacement. A
  session scanning findings must still see gate name + bucket + reason + affected count
  first. (AC#3)
- **R5 — names its fix.** Per `gates-convention.md`, the finding keeps the `CANT_OUTRUN`
  remedy clause alongside the excerpt. (AC#4)
- **R6 — proven by test.** A fixture gate that fails with known output is asserted to have
  that output appear in `checkBridge`'s problems. (AC#5)
- **R7 — `redByConstruction` is untouched.** Those gates are expected red and already
  reported differently. Their path does not change. (AC#6)

## Non-goals

- Changing WHICH gates run, for which specs, or the buckets' semantics.
- Touching the `trace`/`capTrace` instrumentation path (spec 068's surface). The trace
  callback is diagnostics; this is the finding a session reads. They stay separate.
- Altering `timeout`/`error` classification, or the fail-closed posture for a command that
  cannot run.
- Enumerating affected specs — spec 061 R1 deliberately collapsed that; the excerpt does
  not reopen it.

## Requirement → acceptance-criterion map

| AC | Requirement |
|----|-------------|
| #1 A failing required gate's finding includes a bounded excerpt of real output | R1, R3 |
| #2 The excerpt is length-capped | R2, R3 |
| #3 The one-line summary survives as the headline | R4 |
| #4 The finding still names its fix | R5 |
| #5 A test proves the excerpt reaches the finding | R6 |
| #6 `redByConstruction` keeps its current reporting | R7 |

## Evidence at HEAD (verified 2026-09-14)

- `spec-bridge/gates/bridge.mjs:209` — `{ ok: false, kind: "red", reason: "exited N" }`,
  the discard point.
- `spec-bridge/gates/bridge.mjs:338-343` — `gateReason`, which formats the clause.
- `spec-bridge/gates/bridge.mjs:392-406` — `collapsedGateProblems`, the finding a session
  reads.
- `spec-bridge/gates/bridge.mjs:271-285` — `capTrace`, TASK-0121's tail-preserving bound;
  the precedent R3 follows.
