#!/usr/bin/env node
// cli.mjs — command-line entry to the grounding-wiki gates.
//   node cli.mjs freshness <repo-root> [corpus-dir]     (corpus-dir defaults to docs/wiki)
//   node cli.mjs plan <repo-root> [corpus-dir]          computed reconciliation for stale
//                                                       notes: RE-PIN-ONLY entries print
//                                                       runnable repin.mjs commands, NEEDS-
//                                                       REVIEW entries print a work order.
//                                                       Fresh corpus prints nothing.
//                                                       Read-only — plan prints, the
//                                                       wiki-update skill executes.
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { validateFreshness, planFreshness } from "./freshness.mjs";

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
} else if (cmd === "plan") {
  const [root, corpusDir] = rest;
  if (!root) { console.error("usage: cli.mjs plan <repo-root> [corpus-dir]"); process.exit(2); }
  const { head, entries, problems } = planFreshness(root, corpusDir || "docs/wiki");
  if (problems.length) {
    for (const p of problems) console.error(`# problem: ${p} — fix before planning`);
    process.exit(1);
  }
  const repinScript = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "repin.mjs");
  const summary = (e) => e.files.map((f) => `${f.path} (+${f.plus}/-${f.minus})`).join(", ");
  for (const e of entries) {
    if (e.cls === "REPIN") {
      console.log(`# RE-PIN-ONLY ${e.note} — ${e.reason} (${e.commits} commit(s): ${summary(e)})`);
      console.log(`node ${repinScript} ${e.absPath} ${head}`);
    } else {
      console.log(`# NEEDS-REVIEW ${e.note} — pin ${e.pin.slice(0, 12)}, ${e.commits} commit(s); ${e.reason}; changed: ${summary(e)}`);
    }
  }
} else {
  console.error("usage: cli.mjs freshness <repo-root> [corpus-dir] | plan <repo-root> [corpus-dir]");
  process.exit(2);
}
