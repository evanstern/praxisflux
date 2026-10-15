#!/usr/bin/env node
// sync-version.mjs — keep every plugin.json version, the marketplace version, and action.yml's
// npm pin (@praxisflux/gates@<version>) consistent. One release = one version everywhere.
//
//   node scripts/sync-version.mjs 0.3.0   # set everything to 0.3.0
//   node scripts/sync-version.mjs --check # exit 1 if anything disagrees
//
// Anything else — no argument, --help-style flags, extra arguments, a non-semver string —
// is a usage error: usage on stderr, exit 2, ZERO files written. (The old undocumented
// bare-invocation mode, no arg = sync to the marketplace's version, was removed by TASK-69;
// a call-site audit confirmed nothing consumed it.) A target at or below the current
// lockstep value is deliberately allowed: this stays a dumb stamper so repair/rollback is
// possible, and check-version-bump.mjs already gates increases at PR time.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";
import { PACKAGE_NAME } from "./build-npm.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

export const USAGE = "usage: node scripts/sync-version.mjs <x.y.z> | --check";

/** Pure: rewrite every `<name>@<semver>` pin in `text` to `target`.
 *  Returns { text, pins } — pins as found, so a caller can detect drift or a missing pin. */
export function stampNpxPin(text, name, target) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped}@)(\\d+\\.\\d+\\.\\d+)`, "g");
  const pins = [...text.matchAll(re)].map((m) => m[2]);
  return { text: text.replace(re, `$1${target}`), pins };
}

if (runAsCli(import.meta.url)) {
  // Validate argv BEFORE touching any file: exactly one argument, either --check or a
  // strict x.y.z semver. This stamper writes its argument verbatim into all 11 version
  // files — during TASK-63 an unvalidated `--help` was stamped everywhere — so anything
  // it cannot honestly stamp is refused up front (exit 2, the build.mjs usage-error
  // pattern) with zero files written.
  const args = process.argv.slice(2);
  const arg = args[0];
  const check = arg === "--check";
  if (args.length !== 1 || (!check && !/^\d+\.\d+\.\d+$/.test(arg))) {
    console.error(USAGE);
    process.exit(2);
  }

  const mpPath = join(repo, ".claude-plugin", "marketplace.json");
  const mp = JSON.parse(readFileSync(mpPath, "utf8"));
  const target = check ? mp.version : arg;

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

  // The repo's own planted pdlc grounding stamps the version twice (block marker + .pdlc
  // sentinel). A bump that skips them fails CI's `plant.mjs --check` as "drifted" — the
  // recurring re-stamp commits 8526891 / b1cf2bd. Stamp only; template changes still need a
  // real re-plant, which plant --check keeps catching. Absent files (fixtures) are skipped.
  const stamps = [
    [join(repo, "CLAUDE.md"), /(<!-- pdlc:grounding BEGIN v)(\d+\.\d+\.\d+)/],
    [join(repo, ".pdlc"), /("version":\s*")(\d+\.\d+\.\d+)/],
  ];
  for (const [p, re] of stamps) {
    let text;
    try { text = readFileSync(p, "utf8"); } catch { continue; }
    const m = re.exec(text);
    if (!m || m[2] === target) continue;
    mismatch = true;
    if (check) console.error(`  ${p.slice(repo.length + 1)} planted stamp: ${m[2]} != ${target}`);
    else { writeFileSync(p, text.replace(re, `$1${target}`)); console.log(`  ${p.slice(repo.length + 1)} stamp → ${target}`); }
  }

  if (check) { if (mismatch) { console.error("version drift — run: node scripts/sync-version.mjs <x.y.z>"); process.exit(1); } console.log(`all versions = ${target}`); }
  else if (!pins.length) process.exit(1);
  else console.log(`synced to ${target}`);
}
