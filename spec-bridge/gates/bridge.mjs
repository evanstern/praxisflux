// bridge.mjs — read-only logic of the spec-bridge: find Backlog tasks linked to Spec Kit spec
// dirs and judge each task's kanban status against the state its spec artifacts prove.
//
// A task is "linked" by a marker line in its description: `Spec: <dir>` where <dir> is the spec
// directory relative to the project root (the dir holding backlog/). The marker is planted and
// maintained ONLY via the backlog CLI (link/sync skills); this module just reads the task files.
//
// Verdicts per linked task, comparing the task's frontmatter status to the derived status:
//   exceeds — status claims more than the artifacts prove (e.g. Done over unchecked boxes).
//             The Stop-hook gate blocks on these.
//   lags    — artifacts are ahead of the status (honest but stale). Warn, never block.
//   ok      — they agree.
//   unknown — the task uses a status outside To Do / In Progress / Done (custom workflow);
//             the bridge doesn't guess, so it neither blocks nor warns.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { deriveSpecState, STATUS } from "../lib/spec-derive.mjs";
import { hasChild, findRootsDownwards } from "../lib/project-root.mjs";

/**
 * Per-project bridge config: `.spec-bridge.json` at the project root (beside backlog/).
 * `{ "strictDone": true }` turns on analyze-gated Done (see lib/spec-derive.mjs). Missing or
 * malformed config means checkbox-only mode — strictness is opt-in.
 */
export function loadBridgeConfig(root) {
  try { return JSON.parse(readFileSync(join(root, ".spec-bridge.json"), "utf8")) ?? {}; }
  catch { return {}; }
}

const MARKER = /^Spec:\s*(\S+?)\/?\s*$/m;
const RANK = { "to do": 0, "in progress": 1, done: 2 };
const DERIVED_RANK = { [STATUS.TODO]: 0, [STATUS.IN_PROGRESS]: 1, [STATUS.DONE_ELIGIBLE]: 2 };

/**
 * Parse one Backlog task file. Returns { id, status, specDir } for a linked task,
 * null for anything else (no marker, unreadable, or not a task file).
 */
export function parseLinkedTask(raw) {
  const text = String(raw ?? "");
  const marker = text.match(MARKER);
  if (!marker) return null;
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const field = (name) => fm[1].match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, "m"))?.[1]?.replace(/^['"]|['"]$/g, "") ?? "";
  const id = field("id");
  const status = field("status");
  if (!id) return null;
  return { id, status, specDir: marker[1] };
}

/** Scan <root>/backlog/tasks/*.md for linked tasks. Unreadable files are skipped. */
export function findLinkedTasks(root) {
  const dir = join(root, "backlog", "tasks");
  let entries = [];
  try { entries = readdirSync(dir); } catch { return []; }
  const linked = [];
  for (const name of entries.filter((n) => n.endsWith(".md")).sort()) {
    try {
      const task = parseLinkedTask(readFileSync(join(dir, name), "utf8"));
      if (task) linked.push({ ...task, file: join(dir, name) });
    } catch { /* skip unreadable */ }
  }
  return linked;
}

/** Compare a task's Backlog status to its derived status: "exceeds" | "lags" | "ok" | "unknown". */
export function verdict(taskStatus, derivedStatus) {
  const t = RANK[String(taskStatus).toLowerCase()];
  const d = DERIVED_RANK[derivedStatus];
  if (t === undefined || d === undefined) return "unknown";
  return t > d ? "exceeds" : t < d ? "lags" : "ok";
}

/** One human sentence on why a spec dir doesn't prove more than its derived status. */
function shortfall(root, specDir, derived) {
  const missing = ["spec.md", "plan.md"].filter((f) => !existsSync(join(root, specDir, f)));
  const parts = missing.map((f) => `${f} missing`);
  if (derived.tasksTotal === 0) parts.push("no tasks in tasks.md");
  else if (derived.tasksDone < derived.tasksTotal)
    parts.push(`${derived.tasksTotal - derived.tasksDone} of ${derived.tasksTotal} tasks unchecked (${derived.progressNote})`);
  if (derived.analysis?.required) {
    if (!derived.analysis.present)
      parts.push("analysis.md missing (strict Done: save the /speckit.analyze report into the spec dir)");
    else if (derived.analysis.criticals.length)
      parts.push(`unresolved CRITICAL finding(s) in analysis.md: ${derived.analysis.criticals.join(" | ")}`);
  }
  return parts.join(", ") || "artifacts incomplete";
}

/**
 * Judge every linked task under <root>. Returns:
 *   links    — [{ id, status, specDir, derived, verdict }]
 *   problems — blocking messages, one per "exceeds"
 *   warnings — non-blocking messages, one per "lags"
 */
export function checkBridge(root) {
  const links = [];
  const problems = [];
  const warnings = [];
  const requireAnalysis = loadBridgeConfig(root).strictDone === true;
  for (const task of findLinkedTasks(root)) {
    const derived = deriveSpecState(join(root, task.specDir), { requireAnalysis });
    const v = verdict(task.status, derived.status);
    links.push({ ...task, derived, verdict: v });
    if (v === "exceeds") {
      problems.push(
        `[spec-bridge] ${task.id} is "${task.status}" but ${task.specDir} only proves "${derived.status}": ` +
        `${shortfall(root, task.specDir, derived)}. Finish the spec work or set the task back (backlog task edit ${task.id} -s "...").`
      );
    } else if (v === "lags") {
      warnings.push(
        `[spec-bridge] ${task.id} is "${task.status}" but ${task.specDir} already derives "${derived.status}" — run the spec-bridge sync skill to catch the board up.`
      );
    }
  }
  return { links, problems, warnings };
}

/**
 * The Stop-hook gate, in gate-runner shape. Roots are directories holding a backlog/ dir;
 * a root with no linked tasks yields no problems, so the gate is a natural no-op outside
 * bridged projects. "exceeds" blocks; "lags" only warns.
 */
export const bridgeGate = {
  name: "spec-bridge",
  resolveRoots: (startDir) => findRootsDownwards(startDir, hasChild("backlog")),
  check: (root) => checkBridge(root).problems,
  warn: (root) => checkBridge(root).warnings,
};
