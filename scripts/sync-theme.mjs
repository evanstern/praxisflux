#!/usr/bin/env node
// sync-theme.mjs — stamp the shared theme contract from lib/html/base.html into its consumers.
//
// lib/html/base.html is the single hand-edited source of the praxis token schema and the
// theme-cycle core. Consumers (educate's deck template) carry a literal copy between marker
// lines; this script re-stamps those regions so they can never drift by hand-maintenance.
// test/theme-sync.test.mjs runs the same comparison, so drift fails the pre-commit suite.
//
//   node scripts/sync-theme.mjs           # stamp consumers from base.html
//   node scripts/sync-theme.mjs --check   # exit 1 if any consumer region differs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

export const REGIONS = ["praxis:tokens", "praxis:theme"];
export const SOURCE = "lib/html/base.html";
export const CONSUMERS = ["educate/templates/.template/deck.html"];

/** The text between the `<name>:start` and `<name>:end` marker lines (markers excluded). */
export function extractRegion(text, name) {
  const re = new RegExp(`^.*${name}:start.*$\\n([\\s\\S]*?)^.*${name}:end.*$`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
}

/** Replace the region's body in `text` with `body`, keeping the marker lines. */
export function stampRegion(text, name, body) {
  const re = new RegExp(`(^.*${name}:start.*$\\n)[\\s\\S]*?(^.*${name}:end.*$)`, "m");
  return text.replace(re, (_, start, end) => start + body + end);
}

export function driftReport(root = repo) {
  const src = readFileSync(join(root, SOURCE), "utf8");
  const problems = [];
  for (const consumer of CONSUMERS) {
    const dst = readFileSync(join(root, consumer), "utf8");
    for (const name of REGIONS) {
      const canonical = extractRegion(src, name), copy = extractRegion(dst, name);
      if (canonical === null) problems.push(`${SOURCE}: region ${name} has no markers`);
      else if (copy === null) problems.push(`${consumer}: region ${name} has no markers`);
      else if (canonical !== copy) problems.push(`${consumer}: region ${name} drifted from ${SOURCE} (run scripts/sync-theme.mjs)`);
    }
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--check")) {
    const problems = driftReport();
    for (const p of problems) console.error(p);
    if (problems.length) process.exit(1);
    console.log("theme contract in sync");
  } else {
    const src = readFileSync(join(repo, SOURCE), "utf8");
    for (const consumer of CONSUMERS) {
      const p = join(repo, consumer);
      let dst = readFileSync(p, "utf8");
      for (const name of REGIONS) {
        const body = extractRegion(src, name);
        if (body === null) { console.error(`${SOURCE}: region ${name} has no markers`); process.exit(1); }
        if (extractRegion(dst, name) === null) { console.error(`${consumer}: region ${name} has no markers`); process.exit(1); }
        dst = stampRegion(dst, name, body);
      }
      writeFileSync(p, dst);
      console.log(`stamped ${REGIONS.join(", ")} → ${relative(repo, p)}`);
    }
  }
}
