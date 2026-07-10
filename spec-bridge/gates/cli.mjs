#!/usr/bin/env node
// cli.mjs — command-line entry to the spec-bridge gates (read-only; all Backlog writes go
// through the backlog CLI in the skills). The skills call these instead of parsing markdown:
//   node cli.mjs state <specDir>   derived state for one spec dir, as JSON
//   node cli.mjs links <root>      every linked task under <root> with derived state + verdict, as JSON
//   node cli.mjs check <root>      human report; exit 1 if any task's status exceeds its artifacts
//   node cli.mjs plan <root>       the ordered `backlog task edit` commands that reconcile the
//                                  board to the derived state (stdout; nothing on a reconciled
//                                  board). Prints, NEVER executes — the sync skill runs them.
import { resolve } from "node:path";
import { deriveSpecState } from "../lib/spec-derive.mjs";
import { findRootUpwards, hasChild } from "../lib/project-root.mjs";
import { checkBridge, loadBridgeConfig, planBridge } from "./bridge.mjs";

const [cmd, target] = process.argv.slice(2);
if (!cmd || !target) {
  console.error("usage: cli.mjs state <specDir> | links <root> | check <root> | plan <root>");
  process.exit(2);
}

if (cmd === "state") {
  // Honor the project's .spec-bridge.json (strictDone) — same config checkBridge uses.
  const root = findRootUpwards(resolve(target), hasChild("backlog"));
  const requireAnalysis = root ? loadBridgeConfig(root).strictDone === true : false;
  console.log(JSON.stringify(deriveSpecState(target, { requireAnalysis }), null, 2));
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
} else if (cmd === "plan") {
  const { commands, skipped } = planBridge(target);
  for (const s of skipped)
    console.error(`# ${s.id}: status "${s.status}" is outside To Do/In Progress/Done — not planned; resolve by hand`);
  for (const c of commands) console.log(c);
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(2);
}
