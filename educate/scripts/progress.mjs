#!/usr/bin/env node
/**
 * progress.mjs — keep <project>/topics/<topic>/progress.json honest.
 *
 * praxis edition: the mechanics that used to live inline are now the shared lib/ chassis.
 * Root resolution uses lib/project-root (walk up for a `topics/` marker); the
 * "a status cannot exceed the artifacts that prove it" check uses lib/lifecycle. Judgment
 * fields (status, cursor, motivator, gotchas) are NEVER touched — only the mechanical
 * `artifacts` booleans and `updated` are derived.
 *
 * Root resolution order:  1. --root <path>   2. $EDUCATE_PROJECT_ROOT   3. walk up from cwd
 * to a dir containing `topics/`.
 *
 * Usage:
 *   node progress.mjs <topic> --check [--root <dir>]    # validate; exit 1 on any problem
 *   node progress.mjs <topic> --sync  [--root <dir>]    # rewrite derived artifacts map, then validate
 *   node progress.mjs --all --check   [--root <dir>]    # every topic that has a progress.json
 *   node progress.mjs --all --gate    [--root <dir>]    # read-only DoD gate; no-op outside a project
 *
 * Zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { findRootUpwards, hasChild } from "../../lib/project-root.mjs";
import { createLifecycle } from "../../lib/lifecycle.mjs";
import { today } from "../../lib/dates.mjs";

// artifact key in progress.json  ->  filename on disk
const ARTIFACT_FILES = {
  checklist: "checklist.md",
  rawNotes: "raw-notes.md",
  handoff: "HANDOFF.md",
  postBuild: "POST_BUILD_HANDOFF.md",
  deck: "deck.html",
  guide: "guide.md",
};

// The educate lesson lifecycle (vocabulary is educate's; the engine is shared).
const STATES = ["planned", "scaffolded", "taught", "spec'd", "built", "decked", "done"];

/**
 * Resolve the project root (the dir that CONTAINS topics/). In `gate` mode a missing
 * topics/ is not an error — it just means "not an educate project"; return null and the
 * caller exits 0 (allow).
 */
function resolveTopicsDir(args, { gate } = {}) {
  const rootFlagIdx = args.indexOf("--root");
  let root = rootFlagIdx !== -1 ? args[rootFlagIdx + 1] : process.env.EDUCATE_PROJECT_ROOT;
  if (!root) root = findRootUpwards(process.cwd(), hasChild("topics"));
  if (!root) {
    if (gate) return null;
    console.error("Could not locate a project root. Pass --root <dir>, set EDUCATE_PROJECT_ROOT, or run from inside a project containing a topics/ folder.");
    process.exit(2);
  }
  const topicsDir = join(resolve(root), "topics");
  if (!existsSync(topicsDir)) {
    if (gate) return null;
    console.error(`No topics/ folder at ${topicsDir}`);
    process.exit(2);
  }
  return topicsDir;
}

function requiredArtifacts(progress) {
  const dod = progress.definitionOfDone ?? {};
  const req = new Set(["checklist", "rawNotes"]);
  if (dod.decksStandardForEveryLesson) { req.add("deck"); req.add("guide"); }
  // NOTE: handoff/postBuild are no longer required *files*. Under the praxis handoff protocol the
  // SPEC and build-findings are transient payloads in a gitignored .handoff/; the durable evidence
  // that the delegated build ran and its findings were folded in lives in progress.json and is
  // checked separately (see the delegated-build evidence check in checkTopic).
  return req;
}

/** Is this a delegated-build topic? (definitionOfDone.delegatedBuild set, array-or-flag tolerant.) */
function isDelegated(progress) {
  const d = (progress.definitionOfDone ?? {}).delegatedBuild;
  return Array.isArray(d) ? d.length > 0 : Boolean(d);
}

/**
 * Durable residue of the return leg: a "Post-build" / "Return leg" / "Build findings" section in a
 * tracked artifact (guide.md or raw-notes.md). Requiring this on disk — not just a boolean flag —
 * is what stops the most-skipped step from being rubber-stamped.
 */
function hasReturnLegResidue(lessonDir) {
  const RE = /^#{1,6}\s*(post[- ]?build|return leg|build findings)/im;
  for (const f of ["guide.md", "raw-notes.md"]) {
    const p = join(lessonDir, f);
    if (existsSync(p)) { try { if (RE.test(readFileSync(p, "utf8"))) return true; } catch { /* unreadable */ } }
  }
  return false;
}

/** Build the lifecycle for a topic from its definitionOfDone config. */
function lifecycleFor(progress) {
  const dod = progress.definitionOfDone ?? {};
  const requires = { done: [...requiredArtifacts(progress)] };
  if (dod.decksStandardForEveryLesson) requires.decked = ["deck", "guide"];
  return createLifecycle({ states: STATES, artifacts: ARTIFACT_FILES, requires });
}

function checkTopic(TOPICS_DIR, topic, { sync, gate }) {
  const topicDir = join(TOPICS_DIR, topic);
  const progressPath = join(topicDir, "progress.json");
  if (!existsSync(progressPath)) {
    return { topic, problems: [`no progress.json at ${progressPath}`], changed: false };
  }
  const progress = JSON.parse(readFileSync(progressPath, "utf8"));
  const lifecycle = lifecycleFor(progress);
  const delegated = isDelegated(progress);
  const builtRank = STATES.indexOf("built");
  const problems = [];
  let changed = false;

  const ids = new Set();
  for (const lesson of progress.lessons ?? []) {
    ids.add(lesson.id);
    const lessonDir = join(topicDir, lesson.id);
    if (!existsSync(lessonDir)) {
      if (lesson.status !== "planned") problems.push(`${lesson.id}: folder missing but status=${lesson.status}`);
      continue;
    }
    const actual = lifecycle.compute(lessonDir);
    const recorded = lesson.artifacts ?? {};

    // Staleness (recorded != disk) is a --sync/--check concern, NOT a blocking gate.
    for (const key of Object.keys(ARTIFACT_FILES)) {
      if (recorded[key] !== actual[key]) {
        if (sync) { recorded[key] = actual[key]; changed = true; }
        else if (!gate) problems.push(`${lesson.id}: artifacts.${key} recorded=${recorded[key]} but disk=${actual[key]} (run --sync)`);
      }
    }
    lesson.artifacts = recorded;

    // The Definition-of-Done gate: a status may not exceed the artifacts that prove it.
    for (const p of lifecycle.check(lessonDir, lesson.status)) problems.push(`${lesson.id}: ${p}`);

    // Delegated-build evidence lives in progress.json (not loose .handoff/ files): a build that
    // has returned, and a return leg that was folded back into the lesson.
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

  if (sync && changed) {
    progress.updated = today();
    writeFileSync(progressPath, JSON.stringify(progress, null, 2) + "\n");
  }
  return { topic, problems, changed };
}

/** Topic dir names under topicsDir that are real topics (skip ./_ prefixed, need a progress.json). */
function topicsWithProgress(TOPICS_DIR) {
  return readdirSync(TOPICS_DIR).filter((d) => {
    const p = join(TOPICS_DIR, d);
    return !d.startsWith(".") && !d.startsWith("_") && statSync(p).isDirectory() && existsSync(join(p, "progress.json"));
  });
}

/**
 * Read-only Definition-of-Done gate for a whole project root. Returns problem strings
 * (each prefixed with its topic), or [] when this is not an educate project / all clean.
 * Used by the Stop hook via lib/gate-runner.
 */
export function gateProblemsForProject(root) {
  const topicsDir = join(resolve(root), "topics");
  if (!existsSync(topicsDir)) return [];
  const out = [];
  for (const topic of topicsWithProgress(topicsDir)) {
    const { problems } = checkTopic(topicsDir, topic, { gate: true });
    for (const p of problems) out.push(`[${topic}] ${p}`);
  }
  return out;
}

// ---- CLI ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const sync = args.includes("--sync");
  const all = args.includes("--all");
  const gate = args.includes("--gate");
  const TOPICS_DIR = resolveTopicsDir(args, { gate });
  if (gate && TOPICS_DIR === null) process.exit(0); // not an educate project → allow

  const rootFlagIdx = args.indexOf("--root");
  const rootValue = rootFlagIdx !== -1 ? args[rootFlagIdx + 1] : null;
  const topics = all
    ? topicsWithProgress(TOPICS_DIR)
    : args.filter((a) => !a.startsWith("--") && a !== rootValue);

  if (topics.length === 0) {
    console.error("Usage: node progress.mjs <topic> [--check|--sync] [--root <dir>]   (or --all)");
    process.exit(2);
  }

  let anyProblem = false;
  for (const topic of topics) {
    const { problems, changed } = checkTopic(TOPICS_DIR, topic, { sync, gate });
    if (changed) console.log(`[${topic}] synced derived artifacts → progress.json`);
    if (problems.length) {
      anyProblem = true;
      console.log(`[${topic}] ✗ ${problems.length} problem(s):`);
      for (const p of problems) console.log(`   - ${p}`);
    } else {
      console.log(`[${topic}] ✓ progress.json consistent with disk and DoD gates`);
    }
  }
  process.exit(anyProblem ? 1 : 0);
}
