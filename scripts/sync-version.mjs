#!/usr/bin/env node
// sync-version.mjs — keep every plugin.json version and the marketplace version consistent.
//
//   node scripts/sync-version.mjs 0.3.0   # set all plugin.json + marketplace to 0.3.0
//   node scripts/sync-version.mjs         # sync all plugin.json to the marketplace's version
//   node scripts/sync-version.mjs --check # exit 1 if any version disagrees
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const mpPath = join(repo, ".claude-plugin", "marketplace.json");
const mp = JSON.parse(readFileSync(mpPath, "utf8"));

const arg = process.argv[2];
const check = arg === "--check";
const target = arg && !check ? arg : mp.version;

const pjPaths = (mp.plugins || []).map((e) => join(repo, e.source.replace(/^\.\//, ""), ".claude-plugin", "plugin.json"));
let mismatch = false;

for (const p of pjPaths) {
  const pj = JSON.parse(readFileSync(p, "utf8"));
  if (pj.version !== target) {
    mismatch = true;
    if (check) console.error(`  ${pj.name}: ${pj.version} != ${target}`);
    else { pj.version = target; writeFileSync(p, JSON.stringify(pj, null, 2) + "\n"); console.log(`  ${pj.name} → ${target}`); }
  }
}
if (!check && mp.version !== target) { mp.version = target; writeFileSync(mpPath, JSON.stringify(mp, null, 2) + "\n"); }

if (check) { if (mismatch) { console.error("version drift — run sync-version.mjs"); process.exit(1); } console.log(`all versions = ${target}`); }
else console.log(`synced to ${target}`);
