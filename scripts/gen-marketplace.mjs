#!/usr/bin/env node
// gen-marketplace.mjs — regenerate .claude-plugin/marketplace.json's plugins[] from each plugin's
// own .claude-plugin/plugin.json, so the catalog can't drift from the plugins. Preserves the
// marketplace's top-level fields (name/description/owner/version) and any per-plugin category/tags.
//
//   node scripts/gen-marketplace.mjs [--check]   (--check: exit 1 if it would change anything)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const mpPath = join(repo, ".claude-plugin", "marketplace.json");
const mp = JSON.parse(readFileSync(mpPath, "utf8"));

const plugins = (mp.plugins || []).map((entry) => {
  const src = entry.source?.replace(/^\.\//, "") || entry.name;
  const pjPath = join(repo, src, ".claude-plugin", "plugin.json");
  if (!existsSync(pjPath)) return entry;
  const pj = JSON.parse(readFileSync(pjPath, "utf8"));
  return { ...entry, name: pj.name, description: pj.description }; // name+description follow the plugin
});

const next = { ...mp, plugins };
const nextStr = JSON.stringify(next, null, 2) + "\n";
const curStr = readFileSync(mpPath, "utf8");

if (process.argv.includes("--check")) {
  if (nextStr !== curStr) { console.error("marketplace.json is stale — run gen-marketplace.mjs"); process.exit(1); }
  console.log("marketplace.json is up to date"); process.exit(0);
}
writeFileSync(mpPath, nextStr);
console.log(`regenerated marketplace.json from ${plugins.length} plugin manifest(s)`);
