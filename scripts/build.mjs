#!/usr/bin/env node
// build.mjs — package each praxisflux plugin into dist/<plugin>/, self-contained.
//
// Repo-root lib/ is the canonical chassis; each plugin carries a real, committed copy of
// it (stamped by scripts/sync-lib.mjs), so a plain recursive copy here is already
// self-contained — no symlink to dereference.
//
//   node scripts/build.mjs [--plugin <name>|all]
//
// The plugin list is derived from .claude-plugin/marketplace.json (the single source of truth) —
// registering a plugin there is enough to have it packaged; this script needs no edit per plugin.
import { cpSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

export const USAGE = "usage: node scripts/build.mjs [--plugin <name>|all]";

/** Package `only` ("all" or one plugin name) from `repo` into `repo`/dist/<plugin>/.
 *  A full build wipes dist/ first; a --plugin build cleans ONLY that plugin's dist dir —
 *  the other packaged copies (and e.g. dist/npm from build-npm.mjs) must survive.
 *  Throws on an unknown plugin. */
export function buildPlugins(repo, only = "all") {
  const marketplace = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
  const ALL = marketplace.plugins.map((p) => p.name);
  const dist = join(repo, "dist");

  // Guard against drift: the manifest and the on-disk source are meant to be the same list. Warn if
  // a top-level dir looks like a plugin (has .claude-plugin/plugin.json) but isn't registered — it
  // would silently NOT be built. (dist/ holds packaged copies; skip it and other non-source dirs.)
  const registered = new Set(ALL);
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === "dist" || e.name === "node_modules" || e.name.startsWith(".")) continue;
    if (existsSync(join(repo, e.name, ".claude-plugin", "plugin.json")) && !registered.has(e.name))
      console.warn(`warning: ${e.name}/ has a plugin.json but is not in marketplace.json — it will NOT be built`);
  }

  const targets = only === "all" ? ALL : [only];
  for (const plugin of targets)
    if (!existsSync(join(repo, plugin))) throw new Error(`no such plugin: ${plugin}`);

  if (only === "all" && existsSync(dist)) rmSync(dist, { recursive: true, force: true });
  for (const plugin of targets) {
    const src = join(repo, plugin), out = join(dist, plugin);
    if (existsSync(out)) rmSync(out, { recursive: true, force: true }); // scoped clean: this target only
    cpSync(src, out, { recursive: true });
    console.log(`packaged ${plugin} → dist/${plugin}`);
  }
}

if (runAsCli(import.meta.url)) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
  const i = process.argv.indexOf("--plugin");
  const only = i !== -1 ? process.argv[i + 1] : "all";
  if (i !== -1 && (only === undefined || only.startsWith("--"))) {
    console.error(`--plugin needs a value\n${USAGE}`);
    process.exit(2);
  }
  try {
    buildPlugins(repo, only);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
