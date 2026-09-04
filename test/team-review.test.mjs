// team-review: the read-only review gate (checkReview), the run lifecycle CLI (the only
// writer), and the Stop-hook paths through the shared gate-runner. Run records are pointed
// at a scratch dir via $TEAM_REVIEW_HOME so no test touches a real .handoff/ (the
// self-review tests write a .handoff/ INSIDE their own scratch target, deliberately).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, realpathSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { checkReview, citations, gitSnapshot, runsDirFor, reviewGate } from "../team-review/gates/review.mjs";
import { evaluate } from "../lib/gate-runner.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const runMjs = join(repo, "team-review", "scripts", "run.mjs");
const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf8" }).trim();

/** A sample target repo with a few citable files, committed clean. */
function makeTarget() {
  // realpath: macOS tmpdir is a /var -> /private/var symlink, and the run CLI records its
  // resolved cwd — path comparisons in these tests need both sides physical.
  const target = realpathSync(mkdtempSync(join(tmpdir(), "team-review-target-")));
  mkdirSync(join(target, "src"));
  writeFileSync(join(target, "README.md"), "# sample\n");
  writeFileSync(join(target, "src", "app.mjs"), "export const a = 1;\n");
  writeFileSync(join(target, "src", "util.mjs"), "export const u = 1;\n");
  writeFileSync(join(target, "src", "cli.mjs"), "export const c = 1;\n");
  writeFileSync(join(target, "src", "config.mjs"), "export const k = 1;\n");
  git(target, "init", "-q");
  git(target, "add", "-A");
  git(target, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
  return target;
}

const GOOD_REPORT = `# sample — team review

**TL;DR:** fine.

## What we like
- \`src/app.mjs:1\` pure. \`README.md\` exists.

## What could be improved
1. \`src/util.mjs:1\` unused.

## What should be removed
- \`src/config.mjs:1\` empty.

## Stealing for later
- \`src/cli.mjs:1\` minimal.

## Questions for you
- None.
`;

/** An in-memory run record over `target`, report at `report`. */
const makeRun = (target, report, extra = {}) =>
  ({ id: "r1", state: "in-flight", target, report, cwd: dirname(report), snapshot: gitSnapshot(target), ...extra });

function scratchHome() {
  const home = realpathSync(mkdtempSync(join(tmpdir(), "team-review-home-")));
  const env = { ...process.env, TEAM_REVIEW_HOME: home };
  delete env.CLAUDE_PROJECT_DIR; // the session's own project dir must not leak into run scoping
  return { home, env };
}

// ---------- checkReview ----------

test("checkReview: a complete report over an untouched target passes", () => {
  const target = makeTarget();
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  const report = join(outside, "report.md");
  writeFileSync(report, GOOD_REPORT);
  try {
    assert.deepEqual(checkReview(makeRun(target, report)), []);
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test("checkReview: each missing section is a named problem", () => {
  const target = makeTarget();
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  const report = join(outside, "report.md");
  writeFileSync(report, GOOD_REPORT.replace("## What should be removed", "## Elided"));
  try {
    const problems = checkReview(makeRun(target, report));
    assert.deepEqual(problems, ["report missing section: What should be removed"]);
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test("checkReview: citations must resolve — repeated repo-basename prefix tolerated", () => {
  const target = makeTarget();
  const base = target.split("/").pop();
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  const report = join(outside, "report.md");
  // all five citations spelled with the repo basename prefixed, as agents often do
  writeFileSync(report, GOOD_REPORT.replaceAll("`src/", `\`${base}/src/`).replaceAll("`README.md`", `\`${base}/README.md\``));
  try {
    assert.deepEqual(checkReview(makeRun(target, report)), []);
    // and genuinely-unresolving citations fail with the count
    writeFileSync(report, GOOD_REPORT.replaceAll("src/", "ghost/"));
    const problems = checkReview(makeRun(target, report));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /only 1\/5 required citations resolve/);
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test("checkReview: a report inside the reviewed repo is rejected — except under the .handoff transport", () => {
  const target = makeTarget();
  const report = join(target, "report.md");
  writeFileSync(report, GOOD_REPORT);
  try {
    const problems = checkReview(makeRun(target, report, { snapshot: undefined }));
    assert.ok(problems.some((p) => /report lives INSIDE the reviewed repo/.test(p)), problems.join("; "));
    // the transport is exempted plumbing — the self-review default report lands there
    const inTransport = join(target, ".handoff", "team-review", "reports", "team-review-r1.md");
    mkdirSync(dirname(inTransport), { recursive: true });
    writeFileSync(inTransport, GOOD_REPORT);
    assert.deepEqual(checkReview(makeRun(target, inTransport, { snapshot: undefined })), []);
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test("checkReview: a mutated target blocks; restoring it passes again", () => {
  const target = makeTarget();
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  const report = join(outside, "report.md");
  writeFileSync(report, GOOD_REPORT);
  const run = makeRun(target, report);
  try {
    writeFileSync(join(target, "src", "app.mjs"), "export const a = 2;\n");
    const problems = checkReview(run);
    assert.ok(problems.some((p) => /target repo changed during the review/.test(p)), problems.join("; "));
    git(target, "checkout", "--", ".");
    assert.deepEqual(checkReview(run), []);
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test("checkReview: .handoff transport residue never reads as target mutation — genuine changes still do", () => {
  const target = makeTarget();
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  const report = join(outside, "report.md");
  writeFileSync(report, GOOD_REPORT);
  const run = makeRun(target, report); // snapshot taken BEFORE any .handoff/ exists
  try {
    // self-review shape: run records land inside the target after the snapshot
    mkdirSync(join(target, ".handoff", "team-review", "runs"), { recursive: true });
    writeFileSync(join(target, ".handoff", "team-review", "runs", "r1.json"), "{}\n");
    assert.deepEqual(checkReview(run), []);
    // a genuine target mutation alongside the residue must still block
    writeFileSync(join(target, "src", "app.mjs"), "export const a = 2;\n");
    const problems = checkReview(run);
    assert.ok(problems.some((p) => /target repo changed during the review/.test(p)), problems.join("; "));
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test("citations: extracts backticked paths with optional :line spans, deduped", () => {
  assert.deepEqual(
    citations("see `a/b.mjs:12`, `a/b.mjs:12-30`, `c.py` and `not a path`"),
    ["a/b.mjs", "c.py"],
  );
});

// ---------- run lifecycle (the CLI is the only writer) ----------

const cli = (env, cwd, ...args) =>
  spawnSync(process.execPath, [runMjs, ...args], { encoding: "utf8", env, cwd });

test("run lifecycle: begin -> finish over a proven report; record lands in TEAM_REVIEW_HOME", () => {
  const target = makeTarget();
  const { home, env } = scratchHome();
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  const report = join(outside, "report.md");
  try {
    const begin = cli(env, outside, "begin", target, "--report", report);
    assert.equal(begin.status, 0, begin.stderr);
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    assert.ok(readdirSync(home).includes(`${id}.json`));

    const blocked = cli(env, outside, "finish", id);
    assert.equal(blocked.status, 2, "finish must block while the report is unwritten");
    assert.match(blocked.stderr, /report not written yet/);

    writeFileSync(report, GOOD_REPORT);
    const finish = cli(env, outside, "finish", id);
    assert.equal(finish.status, 0, finish.stderr);
    assert.equal(JSON.parse(readFileSync(join(home, `${id}.json`), "utf8")).state, "done");
    assert.equal(git(target, "status", "--porcelain"), "", "target must come out untouched");
  } finally {
    for (const d of [target, home, outside]) rmSync(d, { recursive: true, force: true });
  }
});

test("run lifecycle: abandon closes with durable residue and the reason", () => {
  const target = makeTarget();
  const { home, env } = scratchHome();
  try {
    const begin = cli(env, home, "begin", target);
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    const abandon = cli(env, home, "abandon", id, "user", "cancelled");
    assert.equal(abandon.status, 0, abandon.stderr);
    const rec = JSON.parse(readFileSync(join(home, `${id}.json`), "utf8"));
    assert.equal(rec.state, "abandoned");
    assert.equal(rec.reason, "user cancelled");
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true }); }
});

test("run lifecycle: a same-second begin never overwrites — ids stay distinct", () => {
  const target = makeTarget();
  const { home, env } = scratchHome();
  try {
    // $TEAM_REVIEW_RUN_STAMP (see run.mjs) pins the subprocess's stamp to exactly what this
    // test pre-writes as collision bait — no race against the real clock, no retries.
    const stamp = "2026-01-01-00-00-00";
    env.TEAM_REVIEW_RUN_STAMP = stamp;
    const expected = `${target.split("/").pop()}-${stamp}`;
    writeFileSync(join(home, `${expected}.json`), JSON.stringify({ id: expected, state: "in-flight" }));
    const begin = cli(env, home, "begin", target);
    assert.equal(begin.status, 0, begin.stderr);
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    assert.notEqual(id, expected, "begin must never reuse an existing run id");
    assert.equal(id, `${expected}x`, "collision suffix path must be exercised");
    const ids = readdirSync(home).map((f) => f.replace(/\.json$/, ""));
    assert.equal(new Set(ids).size, ids.length);
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true }); }
});

test("run lifecycle: with no stamp override, begin's id shape is unchanged from today", () => {
  const target = makeTarget();
  const { home, env } = scratchHome();
  delete env.TEAM_REVIEW_RUN_STAMP; // production path — the test seam is inactive
  try {
    const begin = cli(env, home, "begin", target);
    assert.equal(begin.status, 0, begin.stderr);
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    const name = target.split("/").pop();
    assert.match(id, new RegExp(`^${name}-\\d{4}-\\d{2}-\\d{2}-\\d{2}-\\d{2}-\\d{2}x*$`),
      "id must still be <target>-<19-char timestamp>, optionally x-suffixed");
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true }); }
});

// Regression (doc-1): self-review — invoking root == target, .handoff/ NOT gitignored, so the
// run record lands inside the repo under review. The plugin's own paper trail must not trip
// its own read-only gate; a genuine target mutation still must.
test("run lifecycle: self-review with in-repo run records passes untouched, still blocks a mutated target", () => {
  const target = makeTarget();
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  const report = join(outside, "report.md");
  const env = { ...process.env };
  delete env.TEAM_REVIEW_HOME; // records must land at the invoking root — which IS the target
  delete env.CLAUDE_PROJECT_DIR;
  try {
    const begin = cli(env, target, "begin", target, "--report", report);
    assert.equal(begin.status, 0, begin.stderr);
    assert.match(begin.stderr, /SELF-REVIEW/, "begin must escalate the gitignore warning on self-review");
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    assert.ok(readdirSync(join(target, ".handoff", "team-review", "runs")).includes(`${id}.json`),
      "run record must live inside the target repo");

    writeFileSync(report, GOOD_REPORT);
    const finish = cli(env, target, "finish", id);
    assert.equal(finish.status, 0, `untouched self-review target must pass: ${finish.stderr}`);

    // a second run over the same target: genuine mutation must still block
    const begin2 = cli(env, target, "begin", target, "--report", report);
    assert.equal(begin2.status, 0, begin2.stderr);
    const id2 = begin2.stdout.match(/run (\S+) in flight/)[1];
    writeFileSync(join(target, "src", "app.mjs"), "export const a = 2;\n");
    const blocked = cli(env, target, "finish", id2);
    assert.equal(blocked.status, 2, "a genuinely mutated target must still block");
    assert.match(blocked.stderr, /target repo changed during the review/);
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

// Regression (TASK-61): self-review on DEFAULTS must not deadlock. `begin .` used to default
// the report to cwd — inside the target — which finish unconditionally blocked; the only
// escape was --report up front. The default now resolves under the runs home (the exempted
// .handoff/ transport on a self-review), so begin -> write default -> finish round-trips.
test("run lifecycle: self-review round trip passes on the DEFAULT report path — no --report needed", () => {
  const target = makeTarget();
  const env = { ...process.env };
  delete env.TEAM_REVIEW_HOME; // the real self-review shape: runs home root == the target
  delete env.CLAUDE_PROJECT_DIR;
  try {
    const begin = cli(env, target, "begin", ".");
    assert.equal(begin.status, 0, begin.stderr);
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    const report = begin.stdout.match(/report:\s+(\S+)/)[1];
    assert.ok(report.startsWith(join(target, ".handoff") + "/"),
      `default report must land in the target's .handoff transport, got ${report}`);
    assert.ok(report.includes(id), `default report must be run-id-keyed, got ${report}`);

    writeFileSync(report, GOOD_REPORT); // begin already created the reports dir
    const finish = cli(env, target, "finish", id);
    assert.equal(finish.status, 0, `self-review on defaults must not deadlock: ${finish.stderr}`);
  } finally { rmSync(target, { recursive: true, force: true }); }
});

// Policy (TASK-70): a review report is EVIDENCE and lives in tracked state; the transport is
// transient plumbing. On a pure-defaults self-review, finish — after the gate passes — copies
// the proven report to a tracked, run-id-keyed location in the target and records both paths.
// Explicit --report always wins: no copy, no trackedReport on the record.
test("run lifecycle: pure-defaults self-review lands a tracked copy on finish, recorded on the run; --report never copies", () => {
  const target = makeTarget();
  const env = { ...process.env };
  delete env.TEAM_REVIEW_HOME; // the real self-review shape: runs home root == the target
  delete env.CLAUDE_PROJECT_DIR;
  const outside = mkdtempSync(join(tmpdir(), "team-review-out-"));
  try {
    const begin = cli(env, target, "begin", ".");
    assert.equal(begin.status, 0, begin.stderr);
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    const report = begin.stdout.match(/report:\s+(\S+)/)[1];
    const tracked = begin.stdout.match(/tracked:\s+(\S+)/)[1];
    assert.equal(tracked, join(target, "docs", "reviews", `team-review-${id}.md`),
      "begin must name the tracked, run-id-keyed destination");

    writeFileSync(report, GOOD_REPORT);
    const finish = cli(env, target, "finish", id);
    assert.equal(finish.status, 0, `copy-on-finish must not re-open the in-target deadlock: ${finish.stderr}`);
    assert.equal(readFileSync(tracked, "utf8"), GOOD_REPORT, "the proven report must land tracked, on disk");
    const rec = JSON.parse(readFileSync(join(target, ".handoff", "team-review", "runs", `${id}.json`), "utf8"));
    assert.equal(rec.state, "done");
    assert.equal(rec.report, report, "run record must keep the transport path");
    assert.equal(rec.trackedReport, tracked, "run record must name the tracked copy");

    // explicit --report wins: a second self-review run over the same target (its docs/reviews
    // residue now in the begin snapshot) round-trips with NO copy and no trackedReport field
    const report2 = join(outside, "report2.md");
    const begin2 = cli(env, target, "begin", ".", "--report", report2);
    assert.equal(begin2.status, 0, begin2.stderr);
    assert.ok(!/tracked:/.test(begin2.stdout), "--report must suppress the tracked-copy plan");
    const id2 = begin2.stdout.match(/run (\S+) in flight/)[1];
    writeFileSync(report2, GOOD_REPORT);
    const finish2 = cli(env, target, "finish", id2);
    assert.equal(finish2.status, 0, finish2.stderr);
    const rec2 = JSON.parse(readFileSync(join(target, ".handoff", "team-review", "runs", `${id2}.json`), "utf8"));
    assert.equal(rec2.trackedReport, undefined, "explicit --report must never copy");
    assert.deepEqual(readdirSync(join(target, "docs", "reviews")), [`team-review-${id}.md`],
      "no second tracked file may appear");
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

// Regression (TASK-61): the old default was date-keyed — two same-day runs of one target
// collided on a single report path. Run-id keying (reorient's prior art) makes them unique.
test("run lifecycle: two same-day begins default to DISTINCT report paths", () => {
  const target = makeTarget();
  const { home, env } = scratchHome();
  try {
    const reports = [];
    for (let i = 0; i < 2; i++) {
      const begin = cli(env, home, "begin", target);
      assert.equal(begin.status, 0, begin.stderr);
      reports.push(begin.stdout.match(/report:\s+(\S+)/)[1]);
      assert.ok(reports[i].startsWith(home + "/"), `default must live under the runs home, got ${reports[i]}`);
    }
    assert.notEqual(reports[0], reports[1], "same-day default report paths must never collide");
  } finally { rmSync(target, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true }); }
});

// ---------- Stop hook through the shared gate-runner ----------

test("stop hook: blocks an in-flight run in scope, with finish/abandon guidance", () => {
  const target = makeTarget();
  const { home, env } = scratchHome();
  const prev = process.env.TEAM_REVIEW_HOME;
  const prevProject = process.env.CLAUDE_PROJECT_DIR;
  process.env.TEAM_REVIEW_HOME = home;
  delete process.env.CLAUDE_PROJECT_DIR; // evaluate() prefers it over input.cwd
  try {
    const begin = cli(env, home, "begin", target, "--report", join(home, "report.md"));
    const id = begin.stdout.match(/run (\S+) in flight/)[1];
    const { block, message } = evaluate({ cwd: home }, [reviewGate], { cwd: home });
    assert.equal(block, true);
    assert.match(message, new RegExp(`\\[${id}\\] report not written yet`));
    assert.match(message, /run\.mjs finish|finish it/);

    assert.equal(evaluate({ cwd: home, stop_hook_active: true }, [reviewGate]).block, false);

    // out of scope: a different project dir resolves no roots
    const elsewhere = mkdtempSync(join(tmpdir(), "team-review-else-"));
    assert.equal(evaluate({ cwd: elsewhere }, [reviewGate], { cwd: elsewhere }).block, false);
    rmSync(elsewhere, { recursive: true, force: true });

    // finished run: no longer in flight, no longer blocks
    writeFileSync(join(home, "report.md"), GOOD_REPORT);
    const finish = cli(env, home, "finish", id);
    assert.equal(finish.status, 0, finish.stderr);
    assert.equal(evaluate({ cwd: home }, [reviewGate], { cwd: home }).block, false);
  } finally {
    if (prev === undefined) delete process.env.TEAM_REVIEW_HOME; else process.env.TEAM_REVIEW_HOME = prev;
    if (prevProject !== undefined) process.env.CLAUDE_PROJECT_DIR = prevProject;
    rmSync(target, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true });
  }
});

test("runsDirFor: walks up to a .git/.handoff root; TEAM_REVIEW_HOME overrides", () => {
  const prev = process.env.TEAM_REVIEW_HOME;
  delete process.env.TEAM_REVIEW_HOME;
  try {
    const root = mkdtempSync(join(tmpdir(), "team-review-root-"));
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, "deep", "nested"), { recursive: true });
    assert.equal(runsDirFor(join(root, "deep", "nested")), join(root, ".handoff", "team-review", "runs"));
    process.env.TEAM_REVIEW_HOME = "/tmp/override";
    assert.equal(runsDirFor(root), "/tmp/override");
    rmSync(root, { recursive: true, force: true });
  } finally {
    if (prev === undefined) delete process.env.TEAM_REVIEW_HOME; else process.env.TEAM_REVIEW_HOME = prev;
  }
});
