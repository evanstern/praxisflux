#!/usr/bin/env node
// build.mjs — package each praxis plugin into dist/<plugin>/, self-contained.
//
// The shared chassis lives once at repo-root lib/ and is imported by plugins as `../../lib/…`
// during development. A shipped plugin can't see a repo-root sibling, so packaging VENDORS lib/
// into each plugin (dist/<plugin>/lib) and rewrites `../../lib/` → `../lib/` (every lib importer
// sits in a depth-1 subdir — scripts/ or gates/ — so the rewrite is uniform). Run before packaging
// a .plugin or publishing.
//
//   node scripts/build.mjs [--plugin <name>|all]
//
// The plugin list is derived from .claude-plugin/marketplace.json (the single source of truth) —
// registering a plugin there is enough to have it packaged; this script needs no edit per plugin.
import { cpSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const marketplace = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
const ALL = marketplace.plugins.map((p) => p.name);
const dist = join(repo, "dist");

function rewriteLibImports(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "lib") rewriteLibImports(p); continue; }
    if (extname(p) === ".mjs") {
      const s = readFileSync(p, "utf8");
      const r = s.replaceAll("../../lib/", "../lib/");
      if (r !== s) writeFileSync(p, r);
    }
  }
}

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
  cpSync(src, out, { recursive: true });                 // plugin sources
  cpSync(join(repo, "lib"), join(out, "lib"), { recursive: true }); // vendor the chassis
  rewriteLibImports(out);                                // ../../lib → ../lib
  console.log(`packaged ${plugin} → dist/${plugin} (lib vendored, imports rewritten)`);
}
