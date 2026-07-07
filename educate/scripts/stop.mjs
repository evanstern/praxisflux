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
import { wikiStalenessWarnings } from "../gates/wiki.mjs";

const educateGate = {
  name: "educate",
  resolveRoots: (startDir) => {
    const root = findRootUpwards(startDir, hasChild("topics"));
    return root ? [root] : [];
  },
  check: (root) => gateProblemsForProject(root),
  // Corpus-index freshness is a reminder, not a DoD violation — warn (never block) if a WIKI.md
  // has drifted from the vaults on disk. Run wiki.mjs --sync (or progress.mjs --sync) to refresh.
  warn: (root) => wikiStalenessWarnings(root),
};

runStopHook({ gates: [educateGate] });
