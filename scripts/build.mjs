#!/usr/bin/env node
// build.mjs — package each praxis plugin into dist/<plugin>/, self-contained.
//
// The shared chassis lives once at repo-root lib/ and is imported by plugins as `../../lib/…`
// during development. A shipped plugin can't see a repo-root sibling, so packaging VENDORS lib/
// into each plugin (dist/<plugin>/lib) and rewrites `../../lib/` → `../lib/` (every lib importer
// sits in a depth-1 subdir — scripts/ or gates/ — so the rewrite is uniform). Run before packaging
// a .plugin or publishing.
//
//   node scripts/build.mjs [--plugin educate|research|build|all]
import { cpSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const ALL = ["educate", "research", "build"];
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
