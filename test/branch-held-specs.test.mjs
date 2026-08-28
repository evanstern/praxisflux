// branch-held-specs.test.mjs — Phase 3 of spec 058: prove deriveSpecState (not just the
// resolver in isolation, which test/spec-source.test.mjs already covers) sees a spec dir
// that lives only on a pushed task branch, from a checkout that doesn't contain it on disk.
//
// Real scratch git repos in temp dirs throughout (mkdtempSync, real commits, real branches,
// `update-ref` standing in for a push) -- no mocks. Each test gets its own repo: spec-source's
// resolveSpecSource() memoizes per repo root, so distinct temp repos keep tests from bleeding
// into each other's caches.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, chmodSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { deriveSpecState, STATUS, STAGE } from "../lib/spec-derive.mjs";

function sh(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function scratchRepo() {
  const dir = mkdtempSync(join(tmpdir(), "branch-held-specs-"));
  sh(dir, ["init", "-q", "-b", "main"]);
  sh(dir, ["config", "user.email", "t@example.com"]);
  sh(dir, ["config", "user.name", "Test"]);
  writeFileSync(join(dir, "README.md"), "root\n");
  sh(dir, ["add", "-A"]);
  sh(dir, ["commit", "-q", "-m", "init"]);
  return dir;
}

function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

// Commits a spec dir on a fresh branch off HEAD, points a fake `origin/task-*` remote-tracking
// ref at it (standing in for a push, without a real remote), then returns to `main` so the dir
// is absent from the working tree there.
function commitSpecOnTaskBranch(repo, branch, specRelPath, files) {
  sh(repo, ["checkout", "-q", "-b", branch]);
  const specDir = join(repo, specRelPath);
  mkdirSync(specDir, { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(join(specDir, name), body);
  sh(repo, ["add", "-A"]);
  sh(repo, ["commit", "-q", "-m", `add ${specRelPath}`]);
  const sha = sh(repo, ["rev-parse", "HEAD"]).trim();
  sh(repo, ["update-ref", `refs/remotes/origin/${branch}`, sha]);
  sh(repo, ["checkout", "-q", "main"]);
  return specDir;
}

// Runs `fn` with a logging `git` shim shadowing PATH, so real git still executes but every
// invocation's argv is recorded -- used only to count subprocess calls, not to fake answers.
function countGitCalls(fn) {
  const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const shimDir = mkdtempSync(join(tmpdir(), "git-shim-"));
  const logFile = join(shimDir, "calls.log");
  writeFileSync(logFile, "");
  const shimPath = join(shimDir, "git");
  writeFileSync(shimPath, `#!/bin/sh\necho "$@" >> ${JSON.stringify(logFile)}\nexec ${JSON.stringify(realGit)} "$@"\n`);
  chmodSync(shimPath, 0o755);
  const origPath = process.env.PATH;
  process.env.PATH = `${shimDir}:${origPath}`;
  try {
    fn();
    return readFileSync(logFile, "utf8").split("\n").filter(Boolean);
  } finally {
    process.env.PATH = origPath;
    rmSync(shimDir, { recursive: true, force: true });
  }
}

test("a spec dir committed only on a branch derives its true stage from a checkout that lacks it on disk (AC1, AC7)", () => {
  const repo = scratchRepo();
  try {
    const specDir = commitSpecOnTaskBranch(repo, "task-104-ac1", "specs/104-ac1", {
      "spec.md": "# Spec\n",
      "plan.md": "# Plan\n",
      "tasks.md": "## Phase 1\n- [x] T001\n- [x] T002\n\n## Phase 2\n- [x] T003\n- [ ] T004\n",
    });
    assert.equal(existsSync(specDir), false); // confirm it really is absent on disk here

    const state = deriveSpecState(specDir);
    assert.equal(state.status, STATUS.IN_PROGRESS);
    assert.equal(state.stage, STAGE.VALIDATING); // Phase 1 done, only Phase 2's last box open
    assert.equal(state.tasksDone, 3);
    assert.equal(state.tasksTotal, 4);
    // AC7: provenance names the specific ref the artifacts were read from.
    assert.deepEqual(state.source, { kind: "ref", ref: "refs/remotes/origin/task-104-ac1" });
  } finally { cleanup(repo); }
});

test("a worktree spec dir wins over a ref carrying a different version of the same spec (AC2, AC7)", () => {
  const repo = scratchRepo();
  try {
    // Ref version: a fully-done spec (all boxes checked) -- would derive Done-eligible/reviewing.
    const specDir = commitSpecOnTaskBranch(repo, "task-104-ac2", "specs/104-ac2", {
      "spec.md": "# Spec\n",
      "plan.md": "# Plan\n",
      "tasks.md": "## Phase 1\n- [x] T001\n",
    });

    // main's working tree gets its own uncommitted copy: spec.md only, no plan.md yet -- a
    // different stage (planning) than the ref version, so the assertion below is unambiguous
    // about which one was actually read.
    mkdirSync(specDir, { recursive: true });
    writeFileSync(join(specDir, "spec.md"), "# Worktree spec, still planning\n");

    const state = deriveSpecState(specDir);
    assert.equal(state.stage, STAGE.PLANNING); // not "reviewing" -- proves the worktree was read
    assert.equal(state.status, STATUS.IN_PROGRESS);
    // AC7: provenance names the working tree, not the ref.
    assert.deepEqual(state.source, { kind: "worktree", path: specDir });
  } finally { cleanup(repo); }
});

test("no spec dir anywhere derives as today's nothing-proven state, no throw (AC3)", () => {
  const repo = scratchRepo();
  try {
    const specDir = join(repo, "specs", "999-nowhere");
    const state = deriveSpecState(specDir);
    assert.equal(state.status, STATUS.TODO);
    assert.equal(state.stage, STAGE.SPECIFYING);
    assert.equal(state.tasksTotal, 0);
    assert.deepEqual(state.source, { kind: "none" });
  } finally { cleanup(repo); }
});

test("running a derivation leaves git status, HEAD, and the index unchanged (AC4)", () => {
  const repo = scratchRepo();
  try {
    const specDir = commitSpecOnTaskBranch(repo, "task-104-ac4", "specs/104-ac4", {
      "spec.md": "# Spec\n",
      "plan.md": "# Plan\n",
      "tasks.md": "## Phase 1\n- [x] T001\n",
    });

    // Warm the index's stat cache once so a bare `git status` doesn't itself introduce a
    // byte-level diff between the "before" and "after" snapshots below.
    sh(repo, ["status"]);
    const indexBefore = readFileSync(join(repo, ".git", "index"));
    const statusBefore = sh(repo, ["status", "--porcelain"]);
    const headBefore = sh(repo, ["rev-parse", "HEAD"]);

    deriveSpecState(specDir);

    const indexAfter = readFileSync(join(repo, ".git", "index"));
    const statusAfter = sh(repo, ["status", "--porcelain"]);
    const headAfter = sh(repo, ["rev-parse", "HEAD"]);

    assert.equal(statusAfter, statusBefore);
    assert.equal(headAfter, headBefore);
    assert.ok(indexAfter.equals(indexBefore));
  } finally { cleanup(repo); }
});

test("a directory with no .git derives without error (AC8)", () => {
  const plain = mkdtempSync(join(tmpdir(), "no-git-derive-"));
  try {
    const specDir = join(plain, "specs", "001-anything");
    const state = deriveSpecState(specDir);
    assert.equal(state.status, STATUS.TODO);
    assert.equal(state.stage, STAGE.SPECIFYING);
    assert.deepEqual(state.source, { kind: "none" });
  } finally { cleanup(plain); }
});

// AC6: Phase 1's test/spec-source.test.mjs already proves ref enumeration is memoized once at
// resolveSpecSource() itself. Proving it again here, one layer up through deriveSpecState,
// since deriveSpecState calls resolveSpecSource fresh each time and this is the caller the
// Stop hook and sync actually use -- the memoization needs to survive that call boundary too.
test("refs are enumerated once across two derivations of the same spec dir (AC6)", () => {
  const repo = scratchRepo();
  try {
    const specDir = commitSpecOnTaskBranch(repo, "task-104-ac6", "specs/104-ac6", {
      "spec.md": "# Spec\n",
    });

    const calls = countGitCalls(() => {
      deriveSpecState(specDir);
      deriveSpecState(specDir);
    });
    const forEachRefCalls = calls.filter((l) => l.includes("for-each-ref"));
    assert.equal(forEachRefCalls.length, 1);
  } finally { cleanup(repo); }
});
