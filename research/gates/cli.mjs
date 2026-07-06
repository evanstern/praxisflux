#!/usr/bin/env node
// cli.mjs — command-line entry to the research gates.
//   node cli.mjs branch   <vault> [Branch]
//   node cli.mjs analysis <vault> <Branch>
//   node cli.mjs artifact <file.html>
import { basename } from "node:path";
import { validateVault } from "./branch.mjs";
import { validateAnalysis } from "./analysis.mjs";
import { validateArtifact } from "./artifact.mjs";

function report({ fails = [], warns = [] }, okMsg) {
  for (const w of warns) console.log(`warn: ${w}`);
  if (fails.length) {
    console.log(`\nGATE FAILED (${fails.length} issue(s)):`);
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log(okMsg);
  process.exit(0);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "branch") {
  const [root, only] = rest;
  if (!root) { console.error("usage: cli.mjs branch <vault> [Branch]"); process.exit(2); }
  const r = validateVault(root, only);
  report(r, `OK: ${only ? `branch '${only}'` : `${r.count} branch(es)`} well-formed and analyzable.`);
} else if (cmd === "analysis") {
  const [root, branch] = rest;
  if (!root || !branch) { console.error("usage: cli.mjs analysis <vault> <Branch>"); process.exit(2); }
  const r = validateAnalysis(root, branch);
  report(r, `OK: branch '${branch}' has ${r.count} analysis note(s), each grounded in the corpus.`);
} else if (cmd === "artifact") {
  const [file] = rest;
  if (!file) { console.error("usage: cli.mjs artifact <file.html>"); process.exit(2); }
  report(validateArtifact(file), `OK: ${basename(file)} is self-contained and publishable.`);
} else {
  console.error("usage: cli.mjs <branch|analysis|artifact> ...");
  process.exit(2);
}
