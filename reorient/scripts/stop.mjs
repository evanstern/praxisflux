#!/usr/bin/env node
// stop.mjs — reorient's Stop-hook entry, on the shared gate-runner.
import { runStopHook } from "../lib/gate-runner.mjs";
import { reorientGate } from "../gates/reorient.mjs";

runStopHook({ gates: [reorientGate] });
