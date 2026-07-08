#!/usr/bin/env node
// build.mjs — package praxis plugins into dist/<plugin>/.
//
// Since TASK-5, every plugin dir is self-contained at the source level: it carries a
// committed, vendored lib/ (kept in sync from repo-root lib/ by scripts/sync-lib.mjs and
// imported as `../lib/…`). Packaging is therefore a straight copy — no vendoring or import
// rewriting. The plugin list derives from the marketplace catalog so it can't drift.
//
//   node scripts/build.mjs [--plugin <name>|all]
import { cpSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(repo, "dist");
const mp = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
const ALL = (mp.plugins || []).map((p) => (p.source || `./${p.name}`).replace(/^\.\//, ""));

const i = process.argv.indexOf("--plugin");
const only = i !== -1 ? process.argv[i + 1] : "all";
const targets = only === "all" ? ALL : [only];

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
for (const plugin of targets) {
  const src = join(repo, plugin), out = join(dist, plugin);
  if (!existsSync(src)) { console.error(`no such plugin: ${plugin}`); process.exit(1); }
  cpSync(src, out, { recursive: true });
  console.log(`packaged ${plugin} → dist/${plugin} (already self-contained)`);
}
