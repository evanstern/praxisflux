#!/usr/bin/env node
// sync-shared.mjs — stamp shared visual-contract regions from their canonical sources into
// consumers.
//
// Some shared content must live INSIDE consumer files as a literal copy (a planted template
// can't import at runtime): the theme contract from lib/html/base.html, the tooltip snippet
// from lib/toolkit/tooltip.md. Each canonical source wraps its shareable body in marker lines
// (`<name>:start` / `<name>:end`); consumers carry the same markers, and this script re-stamps
// the bodies so they can never drift by hand-maintenance. test/sync-shared.test.mjs runs the
// same comparison, so drift fails the pre-commit suite.
//
//   node scripts/sync-shared.mjs           # stamp all consumers from their sources
//   node scripts/sync-shared.mjs --check   # exit 1 if any consumer region differs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

export const SYNCS = [
  { source: "lib/html/base.html",
    regions: ["praxis:tokens", "praxis:theme"],
    consumers: ["educate/templates/.template/deck.html"] },
  { source: "lib/toolkit/tooltip.md",
    regions: ["praxis:tooltip-css", "praxis:tooltip-js"],
    consumers: ["educate/templates/.template/deck.html"] },
];

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
  const problems = [];
  for (const { source, regions, consumers } of SYNCS) {
    const src = readFileSync(join(root, source), "utf8");
    for (const consumer of consumers) {
      const dst = readFileSync(join(root, consumer), "utf8");
      for (const name of regions) {
        const canonical = extractRegion(src, name), copy = extractRegion(dst, name);
        if (canonical === null) problems.push(`${source}: region ${name} has no markers`);
        else if (copy === null) problems.push(`${consumer}: region ${name} has no markers`);
        else if (canonical !== copy) problems.push(`${consumer}: region ${name} drifted from ${source} (run scripts/sync-shared.mjs)`);
      }
    }
  }
  return problems;
}

if (runAsCli(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const problems = driftReport();
    for (const p of problems) console.error(p);
    if (problems.length) process.exit(1);
    console.log("shared regions in sync");
  } else {
    for (const { source, regions, consumers } of SYNCS) {
      const src = readFileSync(join(repo, source), "utf8");
      for (const consumer of consumers) {
        const p = join(repo, consumer);
        let dst = readFileSync(p, "utf8");
        for (const name of regions) {
          const body = extractRegion(src, name);
          if (body === null) { console.error(`${source}: region ${name} has no markers`); process.exit(1); }
          if (extractRegion(dst, name) === null) { console.error(`${consumer}: region ${name} has no markers`); process.exit(1); }
          dst = stampRegion(dst, name, body);
        }
        writeFileSync(p, dst);
        console.log(`stamped ${regions.join(", ")} → ${consumer}`);
      }
    }
  }
}
