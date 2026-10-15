#!/usr/bin/env node
// stop.mjs — explainer's Stop-hook entry, on the shared gate-runner.
import { runStopHook } from "../lib/gate-runner.mjs";
import { explainerGate } from "../gates/explainer.mjs";

runStopHook({ gates: [explainerGate] });
