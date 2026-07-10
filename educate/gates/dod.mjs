// dod.mjs — educate's Definition-of-Done gate: the READ-ONLY verification logic.
//
// Convention (see docs/skill-patterns.md): gates/ holds the "is this valid?" checkers and never
// writes to disk; the mutating tracker CLI (sync) lives in scripts/progress.mjs, which imports
// from here. Built on the lib/ chassis (lifecycle engine).

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { createLifecycle } from "../lib/lifecycle.mjs";
import { checkHtml } from "../lib/selfcontained.mjs";

// artifact key in progress.json  ->  filename on disk
export const ARTIFACT_FILES = {
  checklist: "checklist.md",
  rawNotes: "raw-notes.md",
  handoff: "HANDOFF.md",
  postBuild: "POST_BUILD_HANDOFF.md",
  deck: "deck.html",
  guide: "guide.md",
};

// The educate lesson lifecycle (vocabulary is educate's; the engine is shared).
export const STATES = ["planned", "scaffolded", "taught", "spec'd", "built", "decked", "done"];

export function requiredArtifacts(progress) {
  const dod = progress.definitionOfDone ?? {};
  const req = new Set(["checklist", "rawNotes"]);
  if (dod.decksStandardForEveryLesson) { req.add("deck"); req.add("guide"); }
  // handoff/postBuild are NOT required files — they're transient .handoff/ payloads; their evidence
  // lives in progress.json and is checked below (delegated-build evidence).
  return req;
}

/** Is this a delegated-build topic? (definitionOfDone.delegatedBuild set, array-or-flag tolerant.) */
export function isDelegated(progress) {
  const d = (progress.definitionOfDone ?? {}).delegatedBuild;
  return Array.isArray(d) ? d.length > 0 : Boolean(d);
}

/**
 * Durable residue of the return leg: a "Post-build" / "Return leg" / "Build findings" section in a
 * tracked artifact (guide.md or raw-notes.md). Requiring this on disk — not just a boolean flag —
 * is what stops the most-skipped step from being rubber-stamped.
 */
export function hasReturnLegResidue(lessonDir) {
  const RE = /^#{1,6}\s*(post[- ]?build|return leg|build findings)/im;
  for (const f of ["guide.md", "raw-notes.md"]) {
    const p = join(lessonDir, f);
    if (existsSync(p)) { try { if (RE.test(readFileSync(p, "utf8"))) return true; } catch { /* unreadable */ } }
  }
  return false;
}

/** Build the lifecycle for a topic from its definitionOfDone config. */
export function lifecycleFor(progress) {
  const dod = progress.definitionOfDone ?? {};
  const requires = { done: [...requiredArtifacts(progress)] };
  if (dod.decksStandardForEveryLesson) requires.decked = ["deck", "guide"];
  return createLifecycle({ states: STATES, artifacts: ARTIFACT_FILES, requires });
}

/**
 * Read-only Definition-of-Done problems for one already-parsed topic. Covers folder-missing,
 * status-vs-artifacts (lifecycle), delegated-build evidence + return-leg residue, and cursor
 * integrity. Never writes; staleness (recorded vs disk) is the tracker's concern, not the gate's.
 */
export function topicDoDProblems(topicDir, progress) {
  const lifecycle = lifecycleFor(progress);
  const delegated = isDelegated(progress);
  const builtRank = STATES.indexOf("built");
  const problems = [];
  const ids = new Set();

  for (const lesson of progress.lessons ?? []) {
    ids.add(lesson.id);
    const lessonDir = join(topicDir, lesson.id);
    if (!existsSync(lessonDir)) {
      if (lesson.status !== "planned") problems.push(`${lesson.id}: folder missing but status=${lesson.status}`);
      continue;
    }

    // a status may not exceed the artifacts that prove it
    for (const p of lifecycle.check(lessonDir, lesson.status)) problems.push(`${lesson.id}: ${p}`);

    // a deck on disk must honor its own contract: single self-contained file, no external hosts
    // (educate has no Google-Fonts exception). Fails block; warns stay advisory.
    const deckPath = join(lessonDir, ARTIFACT_FILES.deck);
    if (existsSync(deckPath)) {
      try {
        for (const f of checkHtml(readFileSync(deckPath, "utf8")).fails)
          problems.push(`${lesson.id}: deck.html is not self-contained — ${f}`);
      } catch { problems.push(`${lesson.id}: deck.html is unreadable`); }
    }

    // delegated-build evidence lives in progress.json (not loose .handoff/ files)
    if (delegated) {
      const rank = STATES.indexOf(lesson.status);
      const h = lesson.handoff ?? {};
      if (rank >= builtRank && !h.returned) {
        problems.push(`${lesson.id}: status=${lesson.status} implies a delegated build returned, but progress.json records no handoff.returned evidence`);
      }
      if (lesson.status === "done" && !h.foldedIn) {
        problems.push(`${lesson.id}: status=done but the return leg is unrecorded (handoff.foldedIn=false) — fold the build findings back into the lesson first`);
      } else if (lesson.status === "done" && h.foldedIn && !hasReturnLegResidue(lessonDir)) {
        problems.push(`${lesson.id}: status=done with handoff.foldedIn=true but no durable return-leg residue on disk — add a "## Post-build" section to guide.md or raw-notes.md; the return leg can't be rubber-stamped`);
      }
    }
  }

  const cur = progress.cursor?.current;
  if (cur && !ids.has(cur)) problems.push(`cursor.current="${cur}" is not a known lesson id`);
  return problems;
}

/** Topic dir names under topicsDir that are real topics (skip ./_ prefixed, need a progress.json). */
export function topicsWithProgress(topicsDir) {
  return readdirSync(topicsDir).filter((d) => {
    const p = join(topicsDir, d);
    return !d.startsWith(".") && !d.startsWith("_") && statSync(p).isDirectory() && existsSync(join(p, "progress.json"));
  });
}

/**
 * Read-only DoD gate for a whole project root. Returns problem strings (topic-prefixed), or []
 * when this is not an educate project / all clean. Used by the Stop hook via lib/gate-runner.
 */
export function gateProblemsForProject(root) {
  const topicsDir = join(resolve(root), "topics");
  if (!existsSync(topicsDir)) return [];
  const out = [];
  for (const topic of topicsWithProgress(topicsDir)) {
    const pp = join(topicsDir, topic, "progress.json");
    if (!existsSync(pp)) continue;
    const progress = JSON.parse(readFileSync(pp, "utf8"));
    for (const p of topicDoDProblems(join(topicsDir, topic), progress)) out.push(`[${topic}] ${p}`);
  }
  return out;
}
