#!/usr/bin/env node
// stop.mjs — team-review's Stop-hook entry, on the shared gate-runner.
//
// The one invariant that should always hold: a review run opened with `run.mjs begin` may not
// be silently walked away from — the turn can't end while an in-flight run (scoped to this
// session's project dir) lacks a report that passes the output gate. Finish it (run.mjs finish)
// or close it with durable residue (run.mjs abandon). The gate resolves roots from the runs
// registry at the invoking root; no runs in scope = no roots = no-op, so this never fires
// outside a reviewing session.
import { runStopHook } from "../lib/gate-runner.mjs";
import { reviewGate } from "../gates/review.mjs";

runStopHook({ gates: [reviewGate] });
