// spec-derive.mjs — derive a kanban status from a Spec Kit spec directory.
//
// The spec-bridge contract: the spec dir (specs/NNN-feature/) is the source of truth and this
// module is the ONLY place its lifecycle is interpreted. It is a pure, stateless read — every
// call re-reads spec.md / plan.md / tasks.md and re-derives, so a regenerated tasks.md
// (renamed, added, or removed phases) is a non-event: nothing is cached, no residue survives.
//
// Status rules (gaps between the canonical Spec Kit stages resolve to the nearer honest state):
//   - no spec.md                                        -> "To Do"
//   - spec.md present, not yet Done-eligible            -> "In Progress"
//   - plan.md present AND tasks.md has >=1 task, all
//     checked                                           -> "Done-eligible"
// "Done-eligible" deliberately isn't "Done": the sync skill may move the Backlog task to Done,
// and the bridge gate treats a Done status without this derivation as a blocking problem.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const STATUS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE_ELIGIBLE: "Done-eligible",
};

const PHASE_HEADING = /^##\s+(.+?)\s*$/;
const TASK_LINE = /^\s*[-*]\s+\[([ xX])\]\s+\S/;

/** Strip Spec Kit's "Phase 3.1:" style prefix so phase names read as AC labels ("Setup"). */
function phaseName(heading) {
  return heading.replace(/^phase\s+[\d.]+\s*:\s*/i, "").trim() || heading;
}

/**
 * Pure parser: tasks.md markdown -> [{ name, done, total }] in document order.
 * A phase is a `##` heading; a task is any checkbox list line under it. Checkbox lines before
 * the first heading are collected under a synthetic "Tasks" phase. Phases with no checkbox
 * lines (e.g. a "Dependencies" notes section) are dropped.
 */
export function parseTasks(markdown) {
  const phases = [];
  let current = null;
  for (const line of String(markdown ?? "").split("\n")) {
    const heading = line.match(PHASE_HEADING);
    if (heading) {
      current = { name: phaseName(heading[1]), done: 0, total: 0 };
      phases.push(current);
      continue;
    }
    const task = line.match(TASK_LINE);
    if (task) {
      if (!current) {
        current = { name: "Tasks", done: 0, total: 0 };
        phases.push(current);
      }
      current.total += 1;
      if (task[1] !== " ") current.done += 1;
    }
  }
  return phases.filter((p) => p.total > 0);
}

/** "Setup: 2/2 · Core: 4/7" — one segment per phase, empty string when there are no tasks. */
export function progressNote(phases) {
  return phases.map((p) => `${p.name}: ${p.done}/${p.total}`).join(" · ");
}

/**
 * Derive the bridge state for one spec dir. Never throws: unreadable or malformed files
 * degrade to "that artifact isn't there yet", so a broken dir derives as an early stage
 * rather than crashing a sync or a Stop hook.
 */
export function deriveSpecState(specDir) {
  const has = (name) => existsSync(join(specDir, name));
  let tasksRaw = "";
  try {
    if (has("tasks.md")) tasksRaw = readFileSync(join(specDir, "tasks.md"), "utf8");
  } catch { tasksRaw = ""; }

  const phases = parseTasks(tasksRaw);
  const tasksTotal = phases.reduce((n, p) => n + p.total, 0);
  const tasksDone = phases.reduce((n, p) => n + p.done, 0);

  let status = STATUS.TODO;
  if (has("spec.md")) {
    status = has("plan.md") && tasksTotal > 0 && tasksDone === tasksTotal
      ? STATUS.DONE_ELIGIBLE
      : STATUS.IN_PROGRESS;
  }

  return { status, phases, tasksDone, tasksTotal, progressNote: progressNote(phases) };
}
