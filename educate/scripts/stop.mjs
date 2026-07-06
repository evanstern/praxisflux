#!/usr/bin/env node
// stop.mjs — educate's Stop-hook entry, on the shared gate-runner.
//
// Registers one educate gate: it resolves the project root by walking up for a `topics/`
// marker, and checks the read-only Definition-of-Done over every topic. The gate-runner
// honors stop_hook_active and is a no-op when no root resolves (not an educate project).
// When research is also installed, its own Stop hook fires independently — so a tree that is
// both an educate project and holds research vaults is gated by both.
import { runStopHook } from "../../lib/gate-runner.mjs";
import { hasChild, findRootUpwards } from "../../lib/project-root.mjs";
import { gateProblemsForProject } from "../gates/dod.mjs";

const educateGate = {
  name: "educate",
  resolveRoots: (startDir) => {
    const root = findRootUpwards(startDir, hasChild("topics"));
    return root ? [root] : [];
  },
  check: (root) => gateProblemsForProject(root),
};

runStopHook({ gates: [educateGate] });
