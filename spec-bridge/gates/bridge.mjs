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
 * Parse one Backlog task file. Returns { id, status, specDir, acs } for a linked task,
 * null for anything else (no marker, unreadable, or not a task file). `acs` is the task's
 * acceptance criteria as [{ index, checked, text }] read from the AC:BEGIN/END block —
 * still read-only; the plan command needs them to compute reconciling edits.
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
  const acs = [];
  const block = text.match(/<!-- AC:BEGIN -->([\s\S]*?)<!-- AC:END -->/);
  if (block)
    for (const m of block[1].matchAll(/^- \[( |x|X)\] #(\d+)\s+(.*\S)\s*$/gm))
      acs.push({ index: +m[2], checked: m[1] !== " ", text: m[3] });
  return { id, status, specDir: marker[1], acs };
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

/* ── plan: the exact backlog edits that reconcile the board ────────────── */

const PHASE_PREFIX = "Spec phase: ";

/** Single-quote a string for verbatim shell use. */
const sq = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

/**
 * Pure planner for ONE linked task: the ordered `backlog task edit` commands that reconcile
 * it to its derived state. Command order matters and is: status move → stale phase-AC
 * removals (highest index first, so earlier indexes stay valid) → phase-AC additions →
 * check/uncheck at post-edit indexes → one progress note (only when something changed).
 * ACs that don't start with "Spec phase: " are human-authored and are never touched.
 */
export function planLinkedTask(task, derived) {
  const cmds = [];
  const edit = (args) => cmds.push(`backlog task edit ${task.id} ${args}`);

  // Status — Done-eligible is the only path to Done and carries the derived final summary.
  const target = derived.status === STATUS.DONE_ELIGIBLE ? "Done" : derived.status;
  const statusChanged = String(task.status).toLowerCase() !== target.toLowerCase();
  if (statusChanged) {
    if (target === "Done")
      edit(`-s ${sq("Done")} --final-summary ${sq(`All spec tasks complete (${derived.progressNote}). Derived Done by spec-bridge sync.`)}`);
    else edit(`-s ${sq(target)}`);
  }

  // Phase-AC reconciliation. The bridge owns exactly the "Spec phase: " ACs.
  const phaseByName = new Map((derived.phases || []).map((p) => [p.name, p]));
  const seen = new Set();
  const removed = new Set();
  for (const a of task.acs || []) {
    if (!a.text.startsWith(PHASE_PREFIX)) continue;
    const name = a.text.slice(PHASE_PREFIX.length);
    if (!phaseByName.has(name) || seen.has(name)) removed.add(a.index); // stale or duplicate
    else seen.add(name);
  }
  for (const i of [...removed].sort((a, z) => z - a)) edit(`--remove-ac ${i}`);

  const additions = (derived.phases || []).filter((p) => !seen.has(p.name));
  for (const p of additions) edit(`--ac ${sq(PHASE_PREFIX + p.name)}`);

  // Post-edit indexes: survivors keep their relative order and renumber from 1; additions
  // append after them, unchecked. Check/uncheck against what each phase actually proves.
  const survivors = (task.acs || []).filter((a) => !removed.has(a.index));
  const finalList = [
    ...survivors.map((a) => ({ text: a.text, checked: a.checked })),
    ...additions.map((p) => ({ text: PHASE_PREFIX + p.name, checked: false })),
  ];
  finalList.forEach((item, i) => {
    if (!item.text.startsWith(PHASE_PREFIX)) return; // human-authored: never touched
    const p = phaseByName.get(item.text.slice(PHASE_PREFIX.length));
    if (!p) return;
    const want = p.total > 0 && p.done === p.total;
    if (want && !item.checked) edit(`--check-ac ${i + 1}`);
    else if (!want && item.checked) edit(`--uncheck-ac ${i + 1}`);
  });

  // One note, only when this sync changed something — no churn in the task history.
  if (cmds.length) {
    const suffix = statusChanged ? ` — status ${task.status} → ${target}` : "";
    edit(`--append-notes ${sq(`spec-bridge sync: ${derived.progressNote}${suffix}`)}`);
  }
  return cmds;
}

/**
 * Plan every linked task under <root>, in queue order. Returns:
 *   commands — ordered `backlog task edit` lines; empty on a reconciled board (no-op)
 *   skipped  — [{ id, status }] for verdict-unknown tasks (custom status: don't guess)
 * Read-only like everything in gates/: plan PRINTS edits, it never executes them.
 */
export function planBridge(root) {
  const commands = [];
  const skipped = [];
  const requireAnalysis = loadBridgeConfig(root).strictDone === true;
  for (const task of findLinkedTasks(root)) {
    const derived = deriveSpecState(join(root, task.specDir), { requireAnalysis });
    if (verdict(task.status, derived.status) === "unknown") { skipped.push({ id: task.id, status: task.status }); continue; }
    commands.push(...planLinkedTask(task, derived));
  }
  return { commands, skipped };
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
