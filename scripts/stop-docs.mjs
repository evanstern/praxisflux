#!/usr/bin/env node
// stop-docs.mjs — praxisflux's own docs-sync Stop gate, wired via the tracked .claude/settings.json.
//
// The grounding docs (docs/wiki, README.md, CLAUDE.md) are the repo's spec surface; letting a
// turn end while they lag the code is "status exceeds proven artifacts" applied to ourselves.
// This gate blocks Stop while either check fails, so every PR generated in this repo carries
// its docs sync. Runs on lib/gate-runner (honors stop_hook_active; no-op outside praxisflux —
// the root must carry docs/wiki/INDEX.md).
import { existsSync, realpathSync } from "node:fs";
import { join, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { runAsCli } from "../lib/cli.mjs";
import { runStopHook } from "../lib/gate-runner.mjs";
import { checkDocs } from "./check-docs.mjs";

/** Realpath when the path exists; return it as given when it doesn't (or can't be resolved). */
const real = (p) => {
  try { return realpathSync(p); } catch { return p; }
};

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

/** True when startDir IS repoDir or lies strictly inside it. Both sides are realpathed:
 *  `repo` derives from import.meta.url, which Node realpaths for ESM entries, while startDir
 *  arrives as launched (CLAUDE_PROJECT_DIR / hook cwd) — without normalizing both, any
 *  symlinked launch path (incl. macOS /tmp vs /private/tmp) silently disables the gate. The
 *  containment check requires a path-separator boundary so a sibling dir like
 *  `.../praxis-anything` never matches and can't block Stop in an unrelated project.
 *  Exported for tests. */
export function underRepo(startDir, repoDir = repo) {
  const s = real(String(startDir));
  const r = real(repoDir);
  return s === r || s.startsWith(r + sep);
}

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
  // Only ever fires for THIS repo: the resolved root must be the praxisflux checkout itself.
  resolveRoots: (startDir) =>
    existsSync(join(repo, "docs", "wiki", "INDEX.md")) && underRepo(startDir) ? [repo] : [],
  check: (root) => [...checkDocs(root), ...freshnessProblems(root)],
};

if (runAsCli(import.meta.url)) await runStopHook({ gates: [gate] });
