#!/usr/bin/env node
// stop.mjs — spec-bridge's Stop-hook entry, on the shared gate-runner.
//
// The one invariant the bridge must always hold: a Backlog task linked to a Spec Kit spec dir
// (a `Spec: <dir>` marker in its description) may not carry a status its spec artifacts don't
// prove. deriveSpecState is stateless and never throws, so this hook is cheap and safe on
// every Stop; the gate resolves roots by a backlog/ dir and is a no-op when none (or no linked
// tasks) are in scope. Lagging-but-honest statuses surface as non-blocking warnings.
import { runStopHook } from "../../lib/gate-runner.mjs";
import { bridgeGate } from "../gates/bridge.mjs";

runStopHook({ gates: [bridgeGate] });
