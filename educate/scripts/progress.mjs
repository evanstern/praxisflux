#!/usr/bin/env node
/**
 * progress.mjs — keep <project>/topics/<topic>/progress.json honest (the tracker CLI).
 *
 * This is the OPERATIONAL entrypoint: it resolves the project root, derives the artifacts map from
 * disk (mutating on --sync), reports staleness, and runs the read-only DoD gate — which lives in
 * ../gates/dod.mjs (gates/ never writes; scripts/ owns the mutation). See docs/skill-patterns.md.
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

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { findRootUpwards, hasChild } from "../lib/project-root.mjs";
import { runAsCli } from "../lib/cli.mjs";
import { today } from "../lib/dates.mjs";
import { ARTIFACT_FILES, lifecycleFor, topicDoDProblems, topicsWithProgress } from "../gates/dod.mjs";
import { syncTopicWiki, syncProjectWiki } from "./wiki.mjs";

/**
 * Resolve the project root (the dir that CONTAINS topics/). In `gate` mode a missing topics/ is
 * not an error — it just means "not an educate project"; return null and the caller exits 0.
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

function checkTopic(TOPICS_DIR, topic, { sync, gate }) {
  const topicDir = join(TOPICS_DIR, topic);
  const progressPath = join(topicDir, "progress.json");
  if (!existsSync(progressPath)) {
    return { topic, problems: [`no progress.json at ${progressPath}`], changed: false };
  }
  const progress = JSON.parse(readFileSync(progressPath, "utf8"));
  const lifecycle = lifecycleFor(progress); // for deriving the artifacts map from disk
  const staleness = [];
  let changed = false;

  // Derive the artifacts map from disk. --sync writes it back; --check reports drift (not a gate).
  for (const lesson of progress.lessons ?? []) {
    const lessonDir = join(topicDir, lesson.id);
    if (!existsSync(lessonDir)) continue; // folder-missing is a DoD concern (see gates/dod.mjs)
    const actual = lifecycle.compute(lessonDir);
    const recorded = lesson.artifacts ?? {};
    for (const key of Object.keys(ARTIFACT_FILES)) {
      if (recorded[key] !== actual[key]) {
        if (sync) { recorded[key] = actual[key]; changed = true; }
        else if (!gate) staleness.push(`${lesson.id}: artifacts.${key} recorded=${recorded[key]} but disk=${actual[key]} (run --sync)`);
      }
    }
    lesson.artifacts = recorded;
  }
  if (sync && changed) {
    progress.updated = today();
    writeFileSync(progressPath, JSON.stringify(progress, null, 2) + "\n");
  }

  // The read-only Definition-of-Done gate.
  const problems = [...staleness, ...topicDoDProblems(topicDir, progress)];
  return { topic, problems, changed };
}

// ---- CLI ----
if (runAsCli(import.meta.url)) {
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
    // The corpus index is derived from disk too — keep topics/<topic>/WIKI.md fresh on every sync.
    if (sync) {
      const w = syncTopicWiki(TOPICS_DIR, topic);
      if (w === "written") console.log(`[${topic}] regenerated WIKI.md (corpus index)`);
    }
    if (problems.length) {
      anyProblem = true;
      console.log(`[${topic}] ✗ ${problems.length} problem(s):`);
      for (const p of problems) console.log(`   - ${p}`);
    } else {
      console.log(`[${topic}] ✓ progress.json consistent with disk and DoD gates`);
    }
  }
  // The project-level index reflects every topic that has research — refresh it after any sync.
  if (sync && syncProjectWiki(TOPICS_DIR) === "written") console.log("regenerated topics/WIKI.md (corpus index)");
  process.exit(anyProblem ? 1 : 0);
}
