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
import { corpusWindow, staleNotesFrom } from "../grounding-wiki/gates/repin-window.mjs";

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

/**
 * Freshness, split into what BLOCKS and what only NOTICES (spec 057 R4).
 *
 * Staleness alone doesn't tell you whether someone is mid-task or negligent. Doctrine
 * sequences the re-pin AFTER the commit that staled the note (read the diff the pin covers,
 * then bump), so between those two commits a stale note is the EXPECTED state. Blocking there
 * blocks every turn until work that doctrine says comes last has landed — which is what
 * trained `--no-verify` and amplified one red gate into ~50 findings (TASK-100, TASK-102).
 *
 * So each stale note is asked one question (grounding-wiki/gates/repin-window.mjs): are the
 * commits that stale it themselves unmerged?
 *   inside the window  → NOTICE. The re-pin is owed — before the PR, per TASK-105's ordering
 *                        ruling — not forgiven. The turn may end.
 *   outside the window → PROBLEM, exactly as before. Nothing on this branch explains it.
 *
 * Deliberately unchanged: this still BLOCKS for real neglect. Weakening it outright would
 * fight TASK-105, which exists because re-grounding gets missed and wants this stronger.
 * checkDocs (README/CLAUDE sync) is never window-aware — it compares tracked files to repo
 * structure, so it is never red by construction.
 *
 * Fails closed everywhere: if the window can't be computed (no base ref, no git, unreadable
 * note), the note counts as OUTSIDE and blocks. Returns { problems, notices }.
 */
function freshnessFindings(root) {
  let out = "";
  try {
    execFileSync(process.execPath, [join(root, "grounding-wiki", "gates", "cli.mjs"), "freshness", root, "docs/wiki"], { encoding: "utf8" });
    return { problems: [], notices: [] };
  } catch (e) {
    out = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
  }

  const blocked = [`docs/wiki is stale — run /grounding-wiki:wiki-update\n${out}`];
  let stale, window;
  try {
    stale = staleNotesFrom(out.split("\n").map((l) => l.replace(/^\s*-\s*/, "")));
    // Nothing parsed as STALE ⇒ the gate failed for some OTHER reason (a malformed note, a
    // missing source, a budget breach). The window has no opinion on those: block.
    if (stale.size === 0) return { problems: blocked, notices: [] };
    window = corpusWindow(root, "docs/wiki", { only: stale });
  } catch {
    return { problems: blocked, notices: [] }; // window unavailable ⇒ fail closed
  }

  if (!window.allInside) return { problems: blocked, notices: [] };

  const owed = window.notes.map((n) => `  - ${n.file} (${n.reason})`).join("\n");
  return {
    problems: [],
    notices: [
      `docs/wiki: ${window.notes.length} note(s) stale from unmerged work on this branch — ` +
      `re-pin OWED before the PR (/grounding-wiki:wiki-update), not forgiven:\n${owed}`,
    ],
  };
}

const gate = {
  name: "docs-sync",
  // Only ever fires for THIS repo: the resolved root must be the praxisflux checkout itself.
  resolveRoots: (startDir) =>
    existsSync(join(repo, "docs", "wiki", "INDEX.md")) && underRepo(startDir) ? [repo] : [],
  // checkDocs always blocks (never red by construction); freshness blocks only outside the
  // re-pin window. Both channels come from ONE freshness run so the two calls can't disagree.
  check: (root) => [...checkDocs(root), ...freshnessFindings(root).problems],
  warn: (root) => freshnessFindings(root).notices,
};

if (runAsCli(import.meta.url)) await runStopHook({ gates: [gate] });
