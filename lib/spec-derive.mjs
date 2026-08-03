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
//
// Every derivation also names a finer STAGE (specifying → planning → implementing →
// validating → reviewing); the status above is a fixed collapse of it (coarseStatus). The
// stage feeds the opt-in phase-level board vocabulary in gates/bridge.mjs and is purely
// additive — nothing here behaves differently because of it.
//
// Strict mode ({ requireAnalysis: true }): checked boxes are necessary but weak proof, so
// Done-eligible additionally requires an analysis report saved as analysis.md in the spec dir
// (the durable artifact of /speckit.analyze — chat output doesn't count) with no unresolved
// CRITICAL findings. The scan is line-based: a line containing the word CRITICAL counts as an
// unresolved finding unless the same line says "resolved" (or carries a checked box).

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const STATUS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE_ELIGIBLE: "Done-eligible",
};

// The finer-grained lifecycle ladder underneath the 3-status vocabulary. Every derivation
// also names the stage it is in; the 3 statuses are a fixed collapse of the 5 stages
// (specifying → To Do; planning/implementing/validating → In Progress; reviewing →
// Done-eligible), so the stage is strictly additive information — consumers that never look
// at it see exactly the behavior above.
export const STAGE = {
  SPECIFYING: "specifying",     // no spec.md yet
  PLANNING: "planning",         // spec.md present, no plan.md
  IMPLEMENTING: "implementing", // plan.md present, work remaining outside the final phase
  VALIDATING: "validating",     // only the final tasks.md phase still has unchecked work,
                                //   or all boxes checked but strict-mode analysis pending
  REVIEWING: "reviewing",       // everything proven — same state as Done-eligible
};

/** The stages in lifecycle order — the ranking the bridge gate compares against. */
export const STAGES = [STAGE.SPECIFYING, STAGE.PLANNING, STAGE.IMPLEMENTING, STAGE.VALIDATING, STAGE.REVIEWING];

/** The fixed collapse: stage → 3-status. */
export function coarseStatus(stage) {
  if (stage === STAGE.SPECIFYING) return STATUS.TODO;
  if (stage === STAGE.REVIEWING) return STATUS.DONE_ELIGIBLE;
  return STATUS.IN_PROGRESS;
}

const PHASE_HEADING = /^##\s+(.+?)\s*$/;
// Captures the checkbox char AND the box's trailing descriptive text. The matched-line SET is
// identical to the old `/^\s*[-*]\s+\[([ xX])\]\s+\S/` (both require a non-space after the box;
// per-line matching, so `.*?\s*$` always closes over the remainder) — this only adds capture
// group 2, so parseTasks() output is byte-identical. The text feeds spec 050's blocking message
// (AC #1: name the phase, the box, and the failing gate).
const TASK_LINE = /^\s*[-*]\s+\[([ xX])\]\s+(\S.*?)\s*$/;

/** Strip Spec Kit's "Phase 3.1:" style prefix so phase names read as AC labels ("Setup"). */
function phaseName(heading) {
  return heading.replace(/^phase\s+[\d.]+\s*:\s*/i, "").trim() || heading;
}

/**
 * Rich internal parse: tasks.md markdown -> [{ name, done, total, boxes }] in document order,
 * where boxes is [{ checked, text }] for every checkbox line under the phase. A phase is a `##`
 * heading; a task is any checkbox list line under it. Checkbox lines before the first heading
 * are collected under a synthetic "Tasks" phase. Phases with no checkbox lines (e.g. a
 * "Dependencies" notes section) are dropped. The two exported views below are pure projections
 * of this one pass, so they can never disagree.
 */
function parsePhaseList(markdown) {
  const phases = [];
  let current = null;
  for (const line of String(markdown ?? "").split("\n")) {
    const heading = line.match(PHASE_HEADING);
    if (heading) {
      current = { name: phaseName(heading[1]), done: 0, total: 0, boxes: [] };
      phases.push(current);
      continue;
    }
    const task = line.match(TASK_LINE);
    if (task) {
      if (!current) {
        current = { name: "Tasks", done: 0, total: 0, boxes: [] };
        phases.push(current);
      }
      current.total += 1;
      const checked = task[1] !== " ";
      if (checked) current.done += 1;
      current.boxes.push({ checked, text: task[2] });
    }
  }
  return phases.filter((p) => p.total > 0);
}

/**
 * Pure parser: tasks.md markdown -> [{ name, done, total }] in document order. The stable
 * shape both the gate and the sync planner consume; deliberately carries no box text (see
 * parseTaskBoxes for that). Byte-identical to its long-standing output.
 */
export function parseTasks(markdown) {
  return parsePhaseList(markdown).map(({ name, done, total }) => ({ name, done, total }));
}

/**
 * The additive companion view (spec 050): tasks.md markdown -> [{ name, boxes }] where boxes is
 * [{ checked, text }] per checkbox line, in document order. Kept SEPARATE from parseTasks rather
 * than widening its objects, because existing tests pin parseTasks/deriveSpecState().phases to
 * the exact { name, done, total } shape — a `boxes` key on those objects would break them. The
 * spec-bridge project-gate check reads this (via deriveSpecState().phaseBoxes) to name the
 * ticked box a red gate stands over.
 */
export function parseTaskBoxes(markdown) {
  return parsePhaseList(markdown).map(({ name, boxes }) => ({ name, boxes }));
}

/** "Setup: 2/2 · Core: 4/7" — one segment per phase, empty string when there are no tasks. */
export function progressNote(phases) {
  return phases.map((p) => `${p.name}: ${p.done}/${p.total}`).join(" · ");
}

/**
 * Unresolved CRITICAL findings in an analysis report, line-based: any line containing the
 * word CRITICAL that isn't marked handled on that same line ("resolved" or a checked box).
 */
export function findCriticalFindings(markdown) {
  return String(markdown ?? "")
    .split("\n")
    .filter((l) => /\bCRITICAL\b/.test(l) && !/resolved/i.test(l) && !/\[[xX]\]/.test(l))
    .map((l) => l.trim());
}

/**
 * Derive the bridge state for one spec dir. Never throws: unreadable or malformed files
 * degrade to "that artifact isn't there yet", so a broken dir derives as an early stage
 * rather than crashing a sync or a Stop hook.
 */
export function deriveSpecState(specDir, { requireAnalysis = false } = {}) {
  const has = (name) => existsSync(join(specDir, name));
  const read = (name) => {
    try { return has(name) ? readFileSync(join(specDir, name), "utf8") : ""; } catch { return ""; }
  };

  const tasksMd = read("tasks.md");
  const phases = parseTasks(tasksMd);
  const phaseBoxes = parseTaskBoxes(tasksMd); // additive: per-box { checked, text }, same pass
  const tasksTotal = phases.reduce((n, p) => n + p.total, 0);
  const tasksDone = phases.reduce((n, p) => n + p.done, 0);

  const analysisPresent = has("analysis.md");
  const criticals = requireAnalysis && analysisPresent ? findCriticalFindings(read("analysis.md")) : [];
  const analysisOk = !requireAnalysis || (analysisPresent && criticals.length === 0);

  // Stage first, status as its fixed collapse — one ladder, two vocabularies. The stage
  // rules refine "In Progress" without moving any 3-status boundary: Done-eligible is still
  // exactly all-boxes-checked (+ clean analysis in strict mode), To Do is still no spec.md.
  const allChecked = tasksTotal > 0 && tasksDone === tasksTotal;
  let stage = STAGE.SPECIFYING;
  if (has("spec.md")) {
    if (!has("plan.md")) stage = STAGE.PLANNING;
    else if (allChecked && analysisOk) stage = STAGE.REVIEWING;
    else {
      // Validating: the only unchecked work left sits in tasks.md's final phase (needs ≥2
      // phases to mean anything), or every box is checked and only the strict-mode analysis
      // artifact is outstanding. Anything earlier is implementing.
      const earlierPhasesDone =
        phases.length >= 2 && phases.slice(0, -1).every((p) => p.done === p.total);
      stage = allChecked || earlierPhasesDone ? STAGE.VALIDATING : STAGE.IMPLEMENTING;
    }
  }

  return {
    status: coarseStatus(stage), stage, phases, tasksDone, tasksTotal,
    // phaseBoxes is strictly additive — .phases keeps its { name, done, total } shape (pinned by
    // existing tests); phaseBoxes carries the box text spec 050's message needs, nothing more.
    phaseBoxes,
    progressNote: progressNote(phases),
    analysis: { required: requireAnalysis, present: analysisPresent, criticals },
  };
}
