#!/usr/bin/env node
// cli.mjs — command-line entry to the spec-bridge gates (read-only; all Backlog writes go
// through the backlog CLI in the skills). The skills call these instead of parsing markdown:
//   node cli.mjs state <specDir>   derived state for one spec dir, as JSON
//   node cli.mjs links <root>      every linked task under <root> with derived state + verdict, as JSON
//   node cli.mjs check <root>      human report; exit 1 if any task's status exceeds its artifacts
import { deriveSpecState } from "../../lib/spec-derive.mjs";
import { checkBridge } from "./bridge.mjs";

const [cmd, target] = process.argv.slice(2);
if (!cmd || !target) {
  console.error("usage: cli.mjs state <specDir> | links <root> | check <root>");
  process.exit(2);
}

if (cmd === "state") {
  console.log(JSON.stringify(deriveSpecState(target), null, 2));
} else if (cmd === "links") {
  console.log(JSON.stringify(checkBridge(target).links, null, 2));
} else if (cmd === "check") {
  const { links, problems, warnings } = checkBridge(target);
  for (const w of warnings) console.log(`warn: ${w}`);
  if (problems.length) {
    console.log(`\nGATE FAILED (${problems.length} issue(s)):`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  console.log(`spec-bridge ok: ${links.length} linked task(s), none exceed their artifacts`);
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(2);
}
