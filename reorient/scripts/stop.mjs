#!/usr/bin/env node
// stop.mjs — reorient's Stop-hook entry, on the shared gate-runner. Before gating, the
// owning session heartbeats its own in-flight runs (writes stay in run.mjs, the only
// writer) — that heartbeat is what lets OTHER sessions tell a live run from an orphan.
import { runStopHook } from "../lib/gate-runner.mjs";
import { reorientGate } from "../gates/reorient.mjs";
import { heartbeatOwnedRuns } from "./run.mjs";

runStopHook({
  gates: [reorientGate],
  before: (input) => {
    const start = process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
    const sessionId = (input && input.session_id) || process.env.CLAUDE_CODE_SESSION_ID || null;
    heartbeatOwnedRuns(start, sessionId);
  },
});
