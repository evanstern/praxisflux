#!/usr/bin/env node
/**
 * wiki.mjs — regenerate the derived corpus indexes (the MUTATING entrypoint).
 *
 * Each learning topic accumulates isolated research vaults; this rolls them up into navigable
 * WIKI.md indexes DERIVED from disk (see ../gates/wiki.mjs for the logic — gates/ never writes,
 * scripts/ owns the mutation). Because it derives from the vaults already on disk, running --sync
 * over an existing project IS the migration path: it materializes WIKI.md from the Home.md trunks
 * that are already there, touching no lesson content.
 *
 *   topics/<topic>/WIKI.md   — one row per research vault in the topic
 *   topics/WIKI.md           — one row per topic that has research
 *
 * Root resolution order:  1. --root <path>   2. $EDUCATE_PROJECT_ROOT   3. walk up from cwd to a
 * dir containing `topics/`.
 *
 * Usage:
 *   node wiki.mjs <topic> --sync   [--root <dir>]   # rewrite topics/<topic>/WIKI.md
 *   node wiki.mjs <topic> --check  [--root <dir>]   # report staleness; exit 1 if stale
 *   node wiki.mjs --all   --sync   [--root <dir>]   # every topic + the project topics/WIKI.md
 *   node wiki.mjs --all   --check  [--root <dir>]   # report staleness across the project
 *
 * Zero external dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { findRootUpwards, hasChild } from "../lib/project-root.mjs";
import { runAsCli } from "../lib/cli.mjs";
import { renderTopicWiki, renderProjectWiki, topicVaults, topicDirs, isStale } from "../gates/wiki.mjs";

function resolveTopicsDir(args) {
  const rootFlagIdx = args.indexOf("--root");
  let root = rootFlagIdx !== -1 ? args[rootFlagIdx + 1] : process.env.EDUCATE_PROJECT_ROOT;
  if (!root) root = findRootUpwards(process.cwd(), hasChild("topics"));
  if (!root) {
    console.error("Could not locate a project root. Pass --root <dir>, set EDUCATE_PROJECT_ROOT, or run from inside a project containing a topics/ folder.");
    process.exit(2);
  }
  const topicsDir = join(resolve(root), "topics");
  if (!existsSync(topicsDir)) { console.error(`No topics/ folder at ${topicsDir}`); process.exit(2); }
  return topicsDir;
}

// Write only when the derived content materially changed (ignoring the date), so `updated` stays
// meaningful and clean topics don't churn. Returns "written" | "unchanged".
function writeIfChanged(path, expected) {
  const changed = isStale(path, expected);
  if (changed) writeFileSync(path, expected);
  return changed ? "written" : "unchanged";
}

/** Regenerate topics/<topic>/WIKI.md. No-op (returns "skipped") if the topic has no vaults. */
export function syncTopicWiki(topicsDir, topic) {
  const topicDir = join(topicsDir, topic);
  if (!topicVaults(topicDir).length) return "skipped";
  return writeIfChanged(join(topicDir, "WIKI.md"), renderTopicWiki(topicDir, topic));
}

/** Regenerate the project-level topics/WIKI.md (index of topics that have research). */
export function syncProjectWiki(topicsDir) {
  return writeIfChanged(join(topicsDir, "WIKI.md"), renderProjectWiki(topicsDir));
}

// ---- CLI ----
if (runAsCli(import.meta.url)) {
  const args = process.argv.slice(2);
  const sync = args.includes("--sync");
  const check = args.includes("--check");
  const all = args.includes("--all");
  if (sync === check) { // exactly one mode required
    console.error("Usage: node wiki.mjs <topic> [--sync|--check] [--root <dir>]   (or --all)");
    process.exit(2);
  }
  const TOPICS_DIR = resolveTopicsDir(args);
  const rootFlagIdx = args.indexOf("--root");
  const rootValue = rootFlagIdx !== -1 ? args[rootFlagIdx + 1] : null;
  const named = args.filter((a) => !a.startsWith("--") && a !== rootValue);

  const topics = all ? topicDirs(TOPICS_DIR).filter((t) => topicVaults(join(TOPICS_DIR, t)).length) : named;
  if (!all && topics.length === 0) {
    console.error("Usage: node wiki.mjs <topic> [--sync|--check] [--root <dir>]   (or --all)");
    process.exit(2);
  }

  let stale = 0;
  if (sync) {
    for (const topic of topics) {
      const r = syncTopicWiki(TOPICS_DIR, topic);
      console.log(`[${topic}] WIKI.md ${r}`);
    }
    if (all) console.log(`topics/WIKI.md ${syncProjectWiki(TOPICS_DIR)}`);
  } else { // --check
    for (const topic of topics) {
      const topicDir = join(TOPICS_DIR, topic);
      const bad = isStale(join(topicDir, "WIKI.md"), renderTopicWiki(topicDir, topic));
      if (bad) stale++;
      console.log(`[${topic}] WIKI.md ${bad ? "✗ stale (run --sync)" : "✓ current"}`);
    }
    if (all) {
      const bad = isStale(join(TOPICS_DIR, "WIKI.md"), renderProjectWiki(TOPICS_DIR));
      if (bad) stale++;
      console.log(`topics/WIKI.md ${bad ? "✗ stale (run --all --sync)" : "✓ current"}`);
    }
  }
  process.exit(stale ? 1 : 0);
}
