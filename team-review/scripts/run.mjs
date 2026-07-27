#!/usr/bin/env node
// scripts/run.mjs — team-review's state-mutating run tracker (the ONLY writer; gates/ never writes).
//
// A run record is the paper trail that a review is in flight, and the evidence base the output
// gate verifies against ("a status can't exceed the artifacts that prove it"). Records ride the
// `.handoff/` transport at the INVOKING project's root (transient plumbing, gitignored, never
// inside the reviewed repo — reviews are read-only by doctrine; skill-patterns §6, third
// placement model); the durable residue is the report itself. A report is EVIDENCE and lives in
// tracked state (TASK-70 policy): on a SELF-REVIEW (invoking root == target) begun on the
// default report path, `finish` copies the proven report to a tracked, run-id-keyed location in
// the target (`docs/reviews/team-review-<run-id>.md`) AFTER the output gate passes — so the
// untouched-target check never sees the copy — and records both paths. Explicit `--report`
// always wins (no copy); run records stay on the transport. $TEAM_REVIEW_HOME overrides the
// location (tests).
//
//   begin <target> [--report <path>]   snapshot the repo, open an in-flight run, print its id
//   finish <id|target>                 run the output gate; pass -> state done; fail -> exit 2
//   abandon <id|target> [reason...]    close without a report, keeping durable residue
//   list                               show runs and states
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { checkReview, gitSnapshot, runsDirFor, reportsDirFor } from "../gates/review.mjs";
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
    // Default report path lives under the runs home, keyed by RUN ID — never bare cwd (a
    // self-review's cwd IS the target, and the gate rightly blocks reports on the target's
    // content), and never date-keyed (two same-day runs must never collide on one report
    // path; reorient's synthesis default is the prior art).
    const report = resolve(ri >= 0 ? rest[ri + 1] : join(reportsDirFor(process.cwd()), `team-review-${id}.md`));
    if (ri < 0) mkdirSync(dirname(report), { recursive: true }); // the default dir must exist for the lead to write into
    const root = dirname(dirname(dirname(RUNS)));
    // Self-review on the DEFAULT report path: the transport-side report is untracked residue,
    // but a report is EVIDENCE and lives in tracked state — so `finish` copies the proven
    // report to this tracked, run-id-keyed location (copy-on-finish, after the gate passes,
    // so the untouched-target check never sees it). Explicit --report always wins: no copy.
    const trackedReport = ri < 0 && root === target ? join(target, "docs", "reviews", `team-review-${id}.md`) : undefined;
    const snapshot = gitSnapshot(target);
    save({ id, state: "in-flight", target, report, trackedReport, cwd: process.cwd(), startedAt: new Date().toISOString(), snapshot });
    if (existsSync(join(root, ".git"))) {
      let ignored = false;
      try { ignored = /(^|\n)\.handoff\/?(\n|$)/.test(readFileSync(join(root, ".gitignore"), "utf8")); } catch { /* no .gitignore */ }
      if (!ignored && root === target) {
        // Self-review with the transport un-ignored: the run records land INSIDE the repo
        // under review. Loud WARN, deliberately not a hard fail — the read-only gate ignores
        // .handoff/ entries, and self-review must work in repos that never gitignored the
        // transport; failing here would reintroduce the very block the gate exemption removes.
        const bar = "!".repeat(76);
        console.error([
          bar,
          "!! WARNING — SELF-REVIEW with .handoff/ not gitignored",
          `!! Invoking root == reviewed target (${root}): this run's records land INSIDE`,
          "!! the repo under review. The read-only gate ignores .handoff/ entries, so the",
          `!! review can still pass — but add '.handoff/' to ${root}/.gitignore`,
          "!! so the transport never clutters git status.",
          ...(trackedReport ? [
            "!! The report is EVIDENCE: on finish the proven report is copied to tracked",
            `!! state at ${trackedReport}.`,
          ] : []),
          bar,
        ].join("\n"));
      } else if (!ignored) {
        console.error(`warning: ${root}/.gitignore does not cover .handoff/ — add it (handoff transport must never clutter git status)`);
      }
    }
    console.log(`run ${id} in flight\n  target:   ${target} (${snapshot.git ? `git @ ${snapshot.head.slice(0, 7)}` : "not a git repo — untouched-check degraded to advisory"})\n  report:   ${report}${trackedReport ? `\n  tracked:  ${trackedReport} (self-review: the proven report is copied here on finish — a report is evidence and lives tracked)` : ""}\n  finish:   node ${process.argv[1]} finish ${id}`);
  } else if (cmd === "finish") {
    const run = findRun(key || ".");
    if (!run) { console.error(`no run matching '${key}' — see: run.mjs list`); process.exit(1); }
    const problems = checkReview(run);
    if (problems.length) { console.error(`review gate BLOCKED for ${run.id}:\n` + problems.map((p) => `  - ${p}`).join("\n")); process.exit(2); }
    if (run.trackedReport) {
      // Copy-on-finish, strictly AFTER the gate passed: the untouched-target check compared
      // snapshots before this copy exists, so landing tracked evidence can never re-open the
      // in-target deadlock the run-id-keyed default fixed. A copy failure leaves the run
      // in-flight — evidence that didn't land durably isn't done.
      mkdirSync(dirname(run.trackedReport), { recursive: true });
      copyFileSync(run.report, run.trackedReport);
    }
    run.state = "done";
    run.finishedAt = new Date().toISOString();
    save(run);
    console.log(`run ${run.id} done — report proven at ${run.report}` + (run.trackedReport ? `\n  tracked copy landed at ${run.trackedReport} — commit it (a review report is evidence)` : ""));
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
