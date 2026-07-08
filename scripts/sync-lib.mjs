#!/usr/bin/env node
// sync-lib.mjs — vendor the repo-root lib/ chassis into every marketplace plugin.
//
// Marketplace installs copy a plugin dir verbatim into the user's plugin cache; anything
// outside the dir (like a repo-root lib/) is invisible there. So each plugin carries a
// committed lib/ copy and imports it as `../lib/…`; this script keeps those copies
// byte-identical to the canonical repo-root lib/. Edit ONLY the repo-root lib/ — plugin
// copies are generated.
//
//   node scripts/sync-lib.mjs            # copy lib/ into each plugin (overwrites)
//   node scripts/sync-lib.mjs --check    # exit 1 if any plugin copy drifts (pre-commit)
import { readFileSync, readdirSync, statSync, cpSync, rmSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = join(repo, "lib");
const mp = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
const plugins = (mp.plugins || []).map((p) => (p.source || `./${p.name}`).replace(/^\.\//, ""));

function listFiles(root) {
  const out = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(relative(root, p));
    }
  })(root);
  return out.sort();
}

function drifted(target) {
  if (!existsSync(target)) return true;
  const a = listFiles(canonical);
  if (JSON.stringify(a) !== JSON.stringify(listFiles(target))) return true;
  return a.some((f) => !readFileSync(join(canonical, f)).equals(readFileSync(join(target, f))));
}

const check = process.argv.includes("--check");
let stale = 0;
for (const plugin of plugins) {
  const target = join(repo, plugin, "lib");
  if (check) {
    if (drifted(target)) { console.error(`stale vendored lib: ${plugin}/lib — run scripts/sync-lib.mjs`); stale = 1; }
    continue;
  }
  rmSync(target, { recursive: true, force: true });
  cpSync(canonical, target, { recursive: true });
  console.log(`synced ${plugin}/lib`);
}
if (check && !stale) console.log("vendored lib copies in sync");
process.exit(stale);
