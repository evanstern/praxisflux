#!/usr/bin/env node
// check-docs.mjs — the deterministic half of docs-sync: README.md and CLAUDE.md must name
// what the repo actually ships.
//
//   node scripts/check-docs.mjs        # exit 1 with a problem list if any doc is out of sync
//
// Checks: every marketplace plugin has a README table row (`| **<name>** |`) and an install
// line (`/plugin install <name>@praxis`); every lib/*.mjs chassis module is named in README's
// chassis section; CLAUDE.md links docs/releasing.md. The semantic half of docs-sync — prose
// matching current code — is the wiki freshness gate's job (docs/wiki notes source README.md
// and CLAUDE.md, so editing them pulls the wiki-update loop in). CI and the Stop hook run both.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

export function checkDocs(root) {
  const problems = [];
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const claude = readFileSync(join(root, "CLAUDE.md"), "utf8");
  const mp = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));

  for (const p of mp.plugins ?? []) {
    if (!readme.includes(`| **${p.name}** |`))
      problems.push(`README.md: plugin '${p.name}' has no row in the plugins table`);
    if (!readme.includes(`/plugin install ${p.name}@praxis`))
      problems.push(`README.md: plugin '${p.name}' has no '/plugin install ${p.name}@praxis' line`);
  }

  for (const f of readdirSync(join(root, "lib"))) {
    if (!f.endsWith(".mjs")) continue;
    const mod = basename(f, ".mjs");
    if (!new RegExp(`\`${mod}\``).test(readme))
      problems.push(`README.md: chassis module '${mod}' (lib/${f}) is not named in the chassis section`);
  }

  if (!claude.includes("docs/releasing.md"))
    problems.push("CLAUDE.md: does not link docs/releasing.md (the version-bump rules)");

  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const problems = checkDocs(root);
  if (problems.length) {
    console.error("docs out of sync:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log("README.md and CLAUDE.md are in sync with the repo");
}
