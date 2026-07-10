#!/usr/bin/env node
// sync-version.mjs — keep every plugin.json version, the marketplace version, and action.yml's
// npm pin (@praxisflux/gates@<version>) consistent. One release = one version everywhere.
//
//   node scripts/sync-version.mjs 0.3.0   # set everything to 0.3.0
//   node scripts/sync-version.mjs         # sync everything to the marketplace's version
//   node scripts/sync-version.mjs --check # exit 1 if anything disagrees
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";
import { PACKAGE_NAME } from "./build-npm.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Pure: rewrite every `<name>@<semver>` pin in `text` to `target`.
 *  Returns { text, pins } — pins as found, so a caller can detect drift or a missing pin. */
export function stampNpxPin(text, name, target) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped}@)(\\d+\\.\\d+\\.\\d+)`, "g");
  const pins = [...text.matchAll(re)].map((m) => m[2]);
  return { text: text.replace(re, `$1${target}`), pins };
}

if (runAsCli(import.meta.url)) {
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

  // action.yml's npx pin rides the same lockstep; a vanished pin fails loudly — the action
  // silently running nothing (or an unpinned latest) is exactly what the gates doctrine forbids.
  const actionPath = join(repo, "action.yml");
  const { text: stamped, pins } = stampNpxPin(readFileSync(actionPath, "utf8"), PACKAGE_NAME, target);
  if (!pins.length) {
    mismatch = true;
    console.error(`  action.yml has no ${PACKAGE_NAME}@<version> pin to stamp`);
  } else if (pins.some((v) => v !== target)) {
    mismatch = true;
    if (check) console.error(`  action.yml npx pin: ${pins.join(", ")} != ${target}`);
    else { writeFileSync(actionPath, stamped); console.log(`  action.yml npx pin → ${target}`); }
  }

  if (check) { if (mismatch) { console.error("version drift — run sync-version.mjs"); process.exit(1); } console.log(`all versions = ${target}`); }
  else if (!pins.length) process.exit(1);
  else console.log(`synced to ${target}`);
}
