#!/usr/bin/env node
// cli.mjs — command-line entry to the spec-bridge gates (read-only; all Backlog writes go
// through the backlog CLI in the skills). The skills call these instead of parsing markdown:
//   node cli.mjs state <specDir>   derived state for one spec dir, as JSON
//   node cli.mjs links <root>      every linked task under <root> with derived state + verdict, as JSON
//   node cli.mjs check <root>      human report; exit 1 if any task's status exceeds its artifacts
//   node cli.mjs verify <root>     run declared project gates against ticked boxes (spec 050);
//                                  exit 1 if any ticked box stands over a red/unrunnable gate.
//                                  The mid-PR counterpart to the Done-eligible Stop-hook check —
//                                  the sweep's per-phase loop and CI call it.
//   node cli.mjs plan <root>       the ordered `backlog task edit` commands that reconcile the
//                                  board to the derived state (stdout; nothing on a reconciled
//                                  board). Prints, NEVER executes — the sync skill runs them.
import { resolve } from "node:path";
import { deriveSpecState } from "../lib/spec-derive.mjs";
import { findRootUpwards, hasChild } from "../lib/project-root.mjs";
import { checkBridge, loadBridgeConfig, planBridge, verifyBridge, vocabularyProfile } from "./bridge.mjs";

const [cmd, target] = process.argv.slice(2);
if (!cmd || !target) {
  console.error("usage: cli.mjs state <specDir> | links <root> | check <root> | verify <root> | plan <root>");
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
} else if (cmd === "verify") {
  const problems = verifyBridge(target);
  if (problems.length) {
    console.log(`\nGATE FAILED (${problems.length} issue(s)):`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  console.log("spec-bridge verify ok: every ticked box's declared project gates are green");
} else if (cmd === "plan") {
  const { commands, skipped } = planBridge(target);
  // Name the vocabulary the board actually speaks: the opted-in phase-level names when
  // .spec-bridge.json carries a statusVocabulary, the 3-status default otherwise.
  const profile = vocabularyProfile(loadBridgeConfig(target));
  const vocab = profile
    ? [...new Set([...Object.values(profile.names), "Done"])].join("/")
    : "To Do/In Progress/Done";
  for (const s of skipped)
    console.error(`# ${s.id}: status "${s.status}" is outside ${vocab} — not planned; resolve by hand`);
  for (const c of commands) console.log(c);
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(2);
}
