import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, chmodSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { resolveSpecSource } from "../lib/spec-source.mjs";

function sh(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

// A real scratch repo with one commit on `main`, so branch work always has a base to fork from.
function scratchRepo() {
  const dir = mkdtempSync(join(tmpdir(), "spec-source-"));
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
// invocation's argv is recorded — used only to count subprocess calls, not to fake git's answers.
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

test("spec dir present in the working tree resolves from fs with zero git", () => {
  const repo = scratchRepo();
  try {
    const specDir = join(repo, "specs", "042-demo");
    mkdirSync(specDir, { recursive: true });
    writeFileSync(join(specDir, "spec.md"), "# Spec\n");
    const { has, read, source } = resolveSpecSource(specDir);
    assert.equal(has("spec.md"), true);
    assert.equal(has("plan.md"), false);
    assert.equal(read("spec.md"), "# Spec\n");
    assert.equal(read("plan.md"), "");
    assert.deepEqual(source, { kind: "worktree", path: specDir });
  } finally { cleanup(repo); }
});

test("a spec dir absent from the working tree resolves from a pushed origin/task-* ref", () => {
  const repo = scratchRepo();
  try {
    const specDir = commitSpecOnTaskBranch(repo, "task-104-demo", "specs/104-demo", {
      "spec.md": "# Spec\n",
      "plan.md": "# Plan\n",
      "tasks.md": "## Phase 1\n- [x] T001\n",
    });

    const { has, read, source } = resolveSpecSource(specDir);
    assert.equal(has("spec.md"), true);
    assert.equal(has("plan.md"), true);
    assert.equal(has("no-such-file.md"), false);
    assert.equal(read("spec.md"), "# Spec\n");
    assert.equal(read("tasks.md"), "## Phase 1\n- [x] T001\n");
    assert.deepEqual(source, { kind: "ref", ref: "refs/remotes/origin/task-104-demo" });
  } finally { cleanup(repo); }
});

test("a worktree spec dir wins over a ref carrying a different version", () => {
  const repo = scratchRepo();
  try {
    const specDir = commitSpecOnTaskBranch(repo, "task-104-wins", "specs/104-wins", {
      "spec.md": "# Ref version\n",
    });

    // main (currently checked out) now gets its OWN copy at the same path, with different
    // content and not yet committed -- the working tree must win without even consulting git.
    mkdirSync(specDir, { recursive: true });
    writeFileSync(join(specDir, "spec.md"), "# Worktree version\n");

    const { read, source } = resolveSpecSource(specDir);
    assert.equal(read("spec.md"), "# Worktree version\n");
    assert.deepEqual(source, { kind: "worktree", path: specDir });
  } finally { cleanup(repo); }
});

test("a spec dir absent from the tree and from every ref degrades without throwing", () => {
  const repo = scratchRepo();
  try {
    const specDir = join(repo, "specs", "999-nowhere");
    const { has, read, source } = resolveSpecSource(specDir);
    assert.equal(has("spec.md"), false);
    assert.equal(read("spec.md"), "");
    assert.deepEqual(source, { kind: "none" });
  } finally { cleanup(repo); }
});

test("a directory with no .git degrades without throwing", () => {
  const plain = mkdtempSync(join(tmpdir(), "no-git-"));
  try {
    const specDir = join(plain, "specs", "001-anything");
    const { has, read, source } = resolveSpecSource(specDir);
    assert.equal(has("spec.md"), false);
    assert.equal(read("spec.md"), "");
    assert.deepEqual(source, { kind: "none" });
  } finally { cleanup(plain); }
});

test("refs are enumerated once across two derivations of the same spec dir", () => {
  const repo = scratchRepo();
  try {
    const specDir = commitSpecOnTaskBranch(repo, "task-104-once", "specs/104-once", {
      "spec.md": "# Spec\n",
    });

    const calls = countGitCalls(() => {
      resolveSpecSource(specDir);
      resolveSpecSource(specDir);
    });
    const forEachRefCalls = calls.filter((l) => l.includes("for-each-ref"));
    assert.equal(forEachRefCalls.length, 1);
  } finally { cleanup(repo); }
});
