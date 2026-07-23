#!/usr/bin/env node
// gen-marketplace.mjs — regenerate .claude-plugin/marketplace.json's plugins[] from each plugin's
// own .claude-plugin/plugin.json, so the catalog can't drift from the plugins. Re-syncs the
// registered entries (name/description follow the plugin) AND registers any top-level dir that
// has a plugin.json but no marketplace entry yet — so the new-plugin checklist's "run
// gen-marketplace.mjs" is true as written. Preserves the marketplace's top-level fields
// (name/description/owner/version) and any per-plugin category/tags.
//
//   node scripts/gen-marketplace.mjs [--check]   (--check: exit 1 if it would change anything)
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

const DEFAULT_CATEGORY = "productivity";

/** Pure regeneration: the marketplace object for `repo`, derived from plugin manifests on disk. */
export function genMarketplace(repo) {
  const mp = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
  const manifest = (dir) => {
    const p = join(repo, dir, ".claude-plugin", "plugin.json");
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
  };

  const plugins = (mp.plugins || []).map((entry) => {
    const pj = manifest(entry.source?.replace(/^\.\//, "") || entry.name);
    if (!pj) return entry;
    return { ...entry, name: pj.name, description: pj.description }; // name+description follow the plugin
  });

  const registered = new Set(plugins.map((e) => e.source?.replace(/^\.\//, "") || e.name));
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || registered.has(e.name)) continue;
    const pj = manifest(e.name);
    if (!pj) continue;
    plugins.push({
      name: pj.name,
      source: `./${e.name}`,
      description: pj.description,
      category: DEFAULT_CATEGORY,
      tags: pj.keywords || [],
    });
  }

  return { ...mp, plugins };
}

if (runAsCli(import.meta.url)) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
  const mpPath = join(repo, ".claude-plugin", "marketplace.json");
  const next = genMarketplace(repo);
  const nextStr = JSON.stringify(next, null, 2) + "\n";
  const curStr = readFileSync(mpPath, "utf8");

  if (process.argv.includes("--check")) {
    if (nextStr !== curStr) { console.error("marketplace.json is stale — run gen-marketplace.mjs"); process.exit(1); }
    console.log("marketplace.json is up to date"); process.exit(0);
  }
  writeFileSync(mpPath, nextStr);
  console.log(`regenerated marketplace.json from ${next.plugins.length} plugin manifest(s)`);
}
