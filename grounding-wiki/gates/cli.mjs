#!/usr/bin/env node
// cli.mjs — command-line entry to the grounding-wiki gates.
//   node cli.mjs freshness <repo-root> [corpus-dir]     (corpus-dir defaults to docs/wiki)
import { validateFreshness } from "./freshness.mjs";

function report({ fails = [], warns = [], checked = 0 }, okMsg) {
  for (const w of warns) console.log(`warn: ${w}`);
  if (fails.length) {
    console.log(`\nGATE FAILED (${fails.length} issue(s)):`);
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log(okMsg.replace("%n", String(checked)));
  process.exit(0);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "freshness") {
  const [root, corpusDir] = rest;
  if (!root) { console.error("usage: cli.mjs freshness <repo-root> [corpus-dir]"); process.exit(2); }
  const r = validateFreshness(root, corpusDir || "docs/wiki");
  report(r, "OK: %n note(s) fresh against their pinned sources.");
} else {
  console.error("usage: cli.mjs freshness <repo-root> [corpus-dir]");
  process.exit(2);
}
