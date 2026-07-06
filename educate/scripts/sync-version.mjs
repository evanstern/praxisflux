#!/usr/bin/env node
/**
 * sync-version.mjs — keep the plugin version in one place.
 *
 * Source of truth: educate.plugin-spec.json -> "version".
 * Mirrors:         .claude-plugin/plugin.json, package.json
 *
 * Usage:
 *   node scripts/sync-version.mjs           # write the spec version into the mirrors
 *   node scripts/sync-version.mjs --check   # exit 1 if any mirror is out of sync (CI/gate)
 *
 * The pre-commit hook runs the writer and re-stages, so the three files can never drift.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

const SPEC = "educate.plugin-spec.json";
const MIRRORS = [".claude-plugin/plugin.json", "package.json"];

const readJson = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
const version = readJson(SPEC).version;
if (!version) {
  console.error(`sync-version: no "version" in ${SPEC}`);
  process.exit(1);
}

const drifted = [];
for (const rel of MIRRORS) {
  const obj = readJson(rel);
  if (obj.version === version) continue;
  drifted.push({ rel, was: obj.version });
  if (!check) {
    obj.version = version;
    writeFileSync(resolve(ROOT, rel), JSON.stringify(obj, null, 2) + "\n");
  }
}

if (check) {
  if (drifted.length) {
    for (const d of drifted) console.error(`sync-version: ${d.rel} is ${d.was}, expected ${version}`);
    console.error(`Run: node scripts/sync-version.mjs`);
    process.exit(1);
  }
  console.log(`sync-version: all mirrors at ${version}`);
} else if (drifted.length) {
  for (const d of drifted) console.log(`  ${d.rel}: ${d.was} -> ${version}`);
} else {
  console.log(`sync-version: already at ${version}`);
}
