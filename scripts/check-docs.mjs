#!/usr/bin/env node
// check-docs.mjs — the deterministic half of docs-sync: README.md and AGENTS.md must name
// what the repo actually ships.
//
//   node scripts/check-docs.mjs        # exit 1 with a problem list if any doc is out of sync
//
// Checks: every marketplace plugin has a README table row (`| **<name>** |`) and an install
// line (`/plugin install <name>@praxisflux`), and neither surface names a plugin the
// marketplace doesn't register (the census is two-way); every "<N> plugins" count claim in
// README prose (digits or number words, e.g. "Nine plugins are registered") equals the
// marketplace plugin count — so count drift is a gate failure, not a review finding; every
// lib/*.mjs chassis module is named in README's chassis section; AGENTS.md — the load-bearing
// planted file every harness reads, spec 074 — links docs/releasing.md; CLAUDE.md's first line
// is the `@AGENTS.md` pointer, so it can never silently regress back into a content file. The
// semantic half of docs-sync — prose matching current code — is the wiki freshness gate's job
// (docs/wiki notes source README.md and AGENTS.md, so editing them pulls the wiki-update loop
// in). CI and the Stop hook run both.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsCli } from "../lib/cli.mjs";

// Number words a README count claim may be written with ("Nine plugins are registered…").
const NUMBER_WORDS = Object.fromEntries([
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
  "nineteen", "twenty",
].map((w, i) => [w, i]));

export function checkDocs(root) {
  const problems = [];
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const claude = readFileSync(join(root, "CLAUDE.md"), "utf8");
  // AGENTS.md is the load-bearing planted file (spec 074); a host not yet re-planted still
  // carries the content in CLAUDE.md itself — fall back to it rather than throw on ENOENT.
  const agentsPath = join(root, "AGENTS.md");
  const agentsExists = existsSync(agentsPath);
  const agents = agentsExists ? readFileSync(agentsPath, "utf8") : claude;
  const mp = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));

  for (const p of mp.plugins ?? []) {
    if (!readme.includes(`| **${p.name}** |`))
      problems.push(`README.md: plugin '${p.name}' has no row in the plugins table`);
    if (!readme.includes(`/plugin install ${p.name}@praxisflux`))
      problems.push(`README.md: plugin '${p.name}' has no '/plugin install ${p.name}@praxisflux' line`);
  }

  // The census is two-way: a table row or install line for an unregistered name means the
  // README enumerates a plugin the marketplace doesn't ship (e.g. one that was removed).
  const registered = new Set((mp.plugins ?? []).map((p) => p.name));
  for (const [, name] of readme.matchAll(/^\| \*\*([a-z0-9-]+)\*\* \|/gm))
    if (!registered.has(name))
      problems.push(`README.md: plugins-table row for '${name}', which marketplace.json does not register`);
  for (const [, name] of readme.matchAll(/^\/plugin install ([a-z0-9-]+)@praxisflux$/gm))
    if (!registered.has(name))
      problems.push(`README.md: install line for '${name}', which marketplace.json does not register`);

  // Count claims: every "<N> plugins" phrase in README prose must equal the catalog count.
  for (const [phrase, num] of readme.matchAll(/\b([A-Za-z]+|\d+)\s+plugins\b/g)) {
    const n = /^\d+$/.test(num) ? Number(num) : NUMBER_WORDS[num.toLowerCase()];
    if (n !== undefined && n !== registered.size)
      problems.push(`README.md: says "${phrase}" but marketplace.json registers ${registered.size}`);
  }

  for (const f of readdirSync(join(root, "lib"))) {
    if (!f.endsWith(".mjs")) continue;
    const mod = basename(f, ".mjs");
    if (!new RegExp(`\`${mod}\``).test(readme))
      problems.push(`README.md: chassis module '${mod}' (lib/${f}) is not named in the chassis section`);
  }

  if (!agents.includes("docs/releasing.md"))
    problems.push(`${agentsExists ? "AGENTS.md" : "CLAUDE.md"}: does not link docs/releasing.md (the version-bump rules)`);

  // The pointer only applies once AGENTS.md exists — a pre-migration host has nothing to
  // point at yet, and that migration is its own honest-drift step (plant.mjs --force), not
  // this check's job.
  if (agentsExists && claude.split("\n")[0] !== "@AGENTS.md")
    problems.push("CLAUDE.md: first line is not the @AGENTS.md pointer");

  return problems;
}

if (runAsCli(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const problems = checkDocs(root);
  if (problems.length) {
    console.error("docs out of sync:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log("README.md and AGENTS.md are in sync with the repo");
}
