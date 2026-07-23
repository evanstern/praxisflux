// team-review: the read-only review gate (checkReview), the run lifecycle CLI (the only
// writer), and the Stop-hook paths through the shared gate-runner. Run records are pointed
// at a scratch dir via $TEAM_REVIEW_HOME so no test touches a real .handoff/.
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

test("checkReview: a report inside the reviewed repo is rejected", () => {
  const target = makeTarget();
  const report = join(target, "report.md");
  writeFileSync(report, GOOD_REPORT);
  try {
    const problems = checkReview(makeRun(target, report, { snapshot: undefined }));
    assert.ok(problems.some((p) => /report lives INSIDE the reviewed repo/.test(p)), problems.join("; "));
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
    // pre-create the record the next begin would pick for every plausible stamp this second
    // spans, forcing the collision suffix; retry across the boundary if the clock rolled.
    let collided = false;
    for (let attempt = 0; attempt < 3 && !collided; attempt++) {
      const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
      const expected = `${target.split("/").pop()}-${stamp}`;
      writeFileSync(join(home, `${expected}.json`), JSON.stringify({ id: expected, state: "in-flight" }));
      const begin = cli(env, home, "begin", target);
      assert.equal(begin.status, 0, begin.stderr);
      const id = begin.stdout.match(/run (\S+) in flight/)[1];
      assert.notEqual(id, expected, "begin must never reuse an existing run id");
      collided = id === `${expected}x`;
    }
    assert.ok(collided, "collision suffix path never exercised across 3 attempts");
    const ids = readdirSync(home).map((f) => f.replace(/\.json$/, ""));
    assert.equal(new Set(ids).size, ids.length);
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
