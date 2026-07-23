#!/usr/bin/env node
// scripts/run.mjs — team-review's state-mutating run tracker (the ONLY writer; gates/ never writes).
//
// A run record is the paper trail that a review is in flight, and the evidence base the output
// gate verifies against ("a status can't exceed the artifacts that prove it"). Records ride the
// `.handoff/` transport at the INVOKING project's root (transient plumbing, gitignored, never
// inside the reviewed repo — reviews are read-only by doctrine; skill-patterns §6, third
// placement model); the durable residue is the report itself. $TEAM_REVIEW_HOME overrides the
// location (tests).
//
//   begin <target> [--report <path>]   snapshot the repo, open an in-flight run, print its id
//   finish <id|target>                 run the output gate; pass -> state done; fail -> exit 2
//   abandon <id|target> [reason...]    close without a report, keeping durable residue
//   list                               show runs and states
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { checkReview, gitSnapshot, runsDirFor } from "../gates/review.mjs";
import { runAsCli } from "../lib/cli.mjs";

const RUNS = runsDirFor(process.cwd());
const runPath = (id) => join(RUNS, `${id}.json`);

function loadRuns() {
  try {
    return readdirSync(RUNS)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(RUNS, f), "utf8")));
  } catch { return []; }
}

/** Find a run by exact id, else the newest in-flight run whose target matches. */
function findRun(key) {
  const runs = loadRuns();
  return (
    runs.find((r) => r.id === key) ||
    runs
      .filter((r) => r.state === "in-flight" && (r.target === resolve(key) || basename(r.target) === key))
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0]
  );
}

const save = (run) => { mkdirSync(RUNS, { recursive: true }); writeFileSync(runPath(run.id), JSON.stringify(run, null, 2) + "\n"); };

if (runAsCli(import.meta.url)) {
  const [cmd, key, ...rest] = process.argv.slice(2);

  if (cmd === "begin") {
    const target = resolve(key || ".");
    if (!existsSync(target)) { console.error(`no such target: ${target}`); process.exit(1); }
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
    let id = `${basename(target)}-${stamp}`;
    while (existsSync(runPath(id))) id += "x"; // never overwrite an existing run record
    const ri = rest.indexOf("--report");
    const report = resolve(ri >= 0 ? rest[ri + 1] : join(process.cwd(), `team-review-${basename(target)}-${stamp.slice(0, 10)}.md`));
    const snapshot = gitSnapshot(target);
    save({ id, state: "in-flight", target, report, cwd: process.cwd(), startedAt: new Date().toISOString(), snapshot });
    const root = dirname(dirname(dirname(RUNS)));
    if (existsSync(join(root, ".git"))) {
      let ignored = false;
      try { ignored = /(^|\n)\.handoff\/?(\n|$)/.test(readFileSync(join(root, ".gitignore"), "utf8")); } catch { /* no .gitignore */ }
      if (!ignored) console.error(`warning: ${root}/.gitignore does not cover .handoff/ — add it (handoff transport must never clutter git status)`);
    }
    console.log(`run ${id} in flight\n  target:   ${target} (${snapshot.git ? `git @ ${snapshot.head.slice(0, 7)}` : "not a git repo — untouched-check degraded to advisory"})\n  report:   ${report}\n  finish:   node ${process.argv[1]} finish ${id}`);
  } else if (cmd === "finish") {
    const run = findRun(key || ".");
    if (!run) { console.error(`no run matching '${key}' — see: run.mjs list`); process.exit(1); }
    const problems = checkReview(run);
    if (problems.length) { console.error(`review gate BLOCKED for ${run.id}:\n` + problems.map((p) => `  - ${p}`).join("\n")); process.exit(2); }
    run.state = "done";
    run.finishedAt = new Date().toISOString();
    save(run);
    console.log(`run ${run.id} done — report proven at ${run.report}`);
  } else if (cmd === "abandon") {
    const run = findRun(key || ".");
    if (!run) { console.error(`no run matching '${key}'`); process.exit(1); }
    run.state = "abandoned";
    run.finishedAt = new Date().toISOString();
    run.reason = rest.join(" ") || "unspecified";
    save(run);
    console.log(`run ${run.id} abandoned (${run.reason}) — residue kept at ${runPath(run.id)}`);
  } else if (cmd === "list") {
    for (const r of loadRuns().sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)))
      console.log(`${r.state.padEnd(9)} ${r.id}  →  ${r.report}`);
  } else {
    console.error("usage: run.mjs begin <target> [--report <path>] | finish <id|target> | abandon <id|target> [reason] | list");
    process.exit(1);
  }
}
