#!/usr/bin/env node
// build.mjs — package each praxisflux plugin into dist/<plugin>/, self-contained.
//
// The shared chassis lives once at repo-root lib/; each plugin carries a `lib -> ../lib`
// symlink, so plugin code imports it as `../lib/…` and skills reference
// `${CLAUDE_PLUGIN_ROOT}/lib/…`. Marketplace installs dereference that symlink themselves
// (the cache copy replaces marketplace-internal symlinks with real copies), so packaging here
// only needs to do the same: copy with dereference so dist/<plugin>/lib is a real directory.
//
//   node scripts/build.mjs [--plugin <name>|all]
//
// The plugin list is derived from .claude-plugin/marketplace.json (the single source of truth) —
// registering a plugin there is enough to have it packaged; this script needs no edit per plugin.
import { cpSync, readdirSync, readFileSync, rmSync, existsSync, lstatSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
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

const i = process.argv.indexOf("--plugin");
const only = i !== -1 ? process.argv[i + 1] : "all";
const targets = only === "all" ? ALL : [only];

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
for (const plugin of targets) {
  const src = join(repo, plugin), out = join(dist, plugin);
  if (!existsSync(src)) { console.error(`no such plugin: ${plugin}`); process.exit(1); }
  cpSync(src, out, { recursive: true });
  // cpSync's dereference option doesn't materialize directory symlinks met mid-recursion, so
  // swap the copied lib symlink for a real copy of the chassis by hand.
  const outLib = join(out, "lib");
  if (existsSync(outLib) && lstatSync(outLib).isSymbolicLink()) {
    rmSync(outLib);
    cpSync(join(repo, "lib"), outLib, { recursive: true });
  }
  console.log(`packaged ${plugin} → dist/${plugin} (lib dereferenced)`);
}
