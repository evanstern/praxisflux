---
name: reorient-run-ownership
description: How reorient run records are owned by the session that began them — owner + heartbeat on the manifest, Stop gate nagging only the owner, non-blocking orphan notices for stale foreign runs, run-id-keyed synthesis targets, and explicit takeover/abandon semantics for concurrent sessions in one checkout.
kind: component
sources:
  - reorient/scripts/run.mjs
  - reorient/gates/reorient.mjs
  - reorient/scripts/stop.mjs
  - lib/gate-runner.mjs
verified_against: 2d6bcdfd143d291424524d1b0575846566dcdae1
---

# reorient run ownership

The reorient run registry (`.handoff/reorient/runs/` at the invoking root) is
**per-checkout shared mutable state**: every session working in the checkout sees the same
records. Ownership makes that safe for concurrent sessions — each run belongs to the
session that began it, liveness is observable, and adopting someone else's run is always
an explicit act. Formalized from a live incident (promptworld 2026-07-26, praxis TASK-52):
two same-day runs collided on one date-keyed synthesis path while the checkout-wide Stop
gate nagged non-owning sessions until an operator abandoned a live run believing it
orphaned.

## How it works

**Owner + heartbeat on the manifest.** `run.mjs begin` stamps `owner` — `sessionId`
(`--session` flag, else `$CLAUDE_CODE_SESSION_ID`, else null), plus `user` and `host`
provenance via `makeOwner` — and `heartbeatAt` (initially `startedAt`). The owning
session's Stop hook refreshes the heartbeat every turn: `stop.mjs` passes a `before`
callback to `runStopHook` that calls `heartbeatOwnedRuns(startDir, sessionId)` —
in-flight runs owned by that session get a fresh `heartbeatAt`; foreign, closed, or
unreadable records are never touched. Writes stay in `run.mjs`, the plugin's only writer.

**The Stop gate nags only the owner.** `reorientGate` consumes the [[gate-runner]]
session context: `ownsRun(run, ctx.sessionId)` returns true/false/null (null = legacy
record or identity-less session). `resolveRoots(startDir, ctx)` returns runs owned by
this session (always) plus checkout-scoped ones; `check(runFile, ctx)` blocks only owned
or undecidable runs — undecidable keeps the legacy checkout-wide behavior. A run owned by
another session **never blocks**; `warn(runFile, ctx)` emits a non-blocking notice once
its heartbeat is older than `STALE_HEARTBEAT_MS` (1h): "looks orphaned", with
`describeOwner` provenance (who, from where, begun when, last heartbeat) and the takeover
command.

**Run-id-keyed synthesis targets.** The default synthesis path is
`docs/design/reorient-<run-id>.md` (run ids are `<root-basename>-<timestamp>` with a
collision suffix) — never date-keyed, so concurrent same-day runs cannot collide on one
output path.

**Explicit claim transfer.** `begin` prints the new run's owner and a notice naming the
owner + heartbeat age of any run already in flight for the same root. `list` shows
state, owner, origin, begun-at, and heartbeat age per run — orphan-vs-live is read off
the registry, not guessed. `abandon` is owner-only: for a foreign run it refuses,
printing provenance and pointing at `takeover <id>`, which transfers ownership (printing
who previously held the run, from where, since when) and resets the heartbeat. `finish`
stays open to any session — the output gate proves the artifacts — but notes foreign
ownership on stderr.

## Connections

- Detail note of [[reorient-plugin]]; the ownership-scoped Stop hook rides the `ctx`
  extension in [[gate-runner]] and instantiates [[gates-convention]] per run.
- Same registry shape as [[team-review-plugin]]'s run records, which remain
  checkout-scoped — ownership is so far a reorient-only need born of multi-session use.
- Covered by the [[test-suite]] (`test/reorient.test.mjs` ownership/heartbeat/takeover
  tests; `test/chassis.test.mjs` ctx threading).

## Operational notes

- CLI: `begin … [--session <id>] | finish <id|root> | abandon <id|root> [reason] |
  takeover <id|root> | list`; `$REORIENT_HOME` overrides the registry dir (tests).
- With no session identity anywhere (no `session_id` in hook input, no
  `$CLAUDE_CODE_SESSION_ID`), everything degrades to the pre-ownership checkout scoping —
  the interim doctrine of beginning runs from inside a worktree still isolates fully.
- `STALE_HEARTBEAT_MS` = 1h, exported from `reorient/gates/reorient.mjs`.
