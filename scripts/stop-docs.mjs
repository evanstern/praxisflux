#!/usr/bin/env node
// stop-docs.mjs — praxis's own docs-sync Stop gate, wired via the tracked .claude/settings.json.
//
// The grounding docs (docs/wiki, README.md, CLAUDE.md) are the repo's spec surface; letting a
// turn end while they lag the code is "status exceeds proven artifacts" applied to ourselves.
// This gate blocks Stop while either check fails, so every PR generated in this repo carries
// its docs sync. Runs on lib/gate-runner (honors stop_hook_active; no-op outside praxis —
// the root must carry docs/wiki/INDEX.md).
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { runStopHook } from "../lib/gate-runner.mjs";
import { checkDocs } from "./check-docs.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

function freshnessProblems(root) {
  try {
    execFileSync(process.execPath, [join(root, "grounding-wiki", "gates", "cli.mjs"), "freshness", root, "docs/wiki"], { encoding: "utf8" });
    return [];
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
    return [`docs/wiki is stale — run /grounding-wiki:wiki-update\n${out}`];
  }
}

const gate = {
  name: "docs-sync",
  // Only ever fires for THIS repo: the resolved root must be the praxis checkout itself.
  resolveRoots: (startDir) =>
    existsSync(join(repo, "docs", "wiki", "INDEX.md")) && (startDir === repo || String(startDir).startsWith(repo)) ? [repo] : [],
  check: (root) => [...checkDocs(root), ...freshnessProblems(root)],
};

await runStopHook({ gates: [gate] });
