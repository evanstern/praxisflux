import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { computeFingerprint, recordApproval, resolveGeneratorCwd } from "../../explainer/scripts/lib/approvals.mjs";
import { bucketFor, globToRegExp, runCommandGenerator, runGenerators, runGitManifest } from "../../explainer/scripts/lib/generators.mjs";

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// --- git-manifest ----------------------------------------------

function initGitRepo() {
  const dir = tmpDir("explainer-gitmanifest-");
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", env });
  git("init", "-q");
  fs.writeFileSync(path.join(dir, "README.md"), "init\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");

  fs.mkdirSync(path.join(dir, "plugins", "demo", "vcs", "core"), { recursive: true });
  fs.writeFileSync(path.join(dir, "plugins", "demo", "vcs", "core", "foo.py"), "x = 1\n");
  fs.mkdirSync(path.join(dir, "docs", "design"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "design", "note.md"), "note\n");
  git("add", "-A");
  git("commit", "-q", "-m", "add files");
  return dir;
}

test("globToRegExp: ** crosses path segments, * stays within one, literals are escaped", () => {
  assert.ok(globToRegExp("plugins/*/vcs/core/**").test("plugins/demo/vcs/core/foo.py"));
  assert.ok(globToRegExp("plugins/*/vcs/core/**").test("plugins/demo/vcs/core/deep/bar.py"));
  assert.ok(!globToRegExp("plugins/*/vcs/core/**").test("plugins/a/b/vcs/core/foo.py"), "* must not cross /");
  assert.ok(globToRegExp("docs/design/**").test("docs/design/note.md"));
  assert.ok(!globToRegExp("docs/design/**").test("docs/other/note.md"));
});

test("bucketFor returns the first bucket (declared order) whose match[] covers the path, else null", () => {
  const buckets = [
    { id: "core", label: "Core", match: ["plugins/*/vcs/core/**"] },
    { id: "catch-all", label: "Catch-all", match: ["**"] },
  ];
  assert.equal(bucketFor("plugins/demo/vcs/core/foo.py", buckets), "core");
  assert.equal(bucketFor("README.md", buckets), "catch-all");
  assert.equal(bucketFor("README.md", [buckets[0]]), null);
});

test("runGitManifest buckets every changed path and reports per-bucket counts", () => {
  const repo = initGitRepo();
  try {
    const result = runGitManifest(
      {
        range: "HEAD~1...HEAD",
        buckets: [
          { id: "core", label: "Core", match: ["plugins/*/vcs/core/**"] },
          { id: "docs", label: "Docs", match: ["docs/design/**"] },
        ],
      },
      { repoRoot: repo }
    );
    assert.equal(result.files.length, 2);
    assert.deepEqual(result.counts, { core: 1, docs: 1 });
    const byPath = Object.fromEntries(result.files.map((f) => [f.path, f]));
    assert.equal(byPath["plugins/demo/vcs/core/foo.py"].bucket, "core");
    assert.equal(byPath["plugins/demo/vcs/core/foo.py"].status, "A");
    assert.equal(byPath["docs/design/note.md"].bucket, "docs");
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("runGitManifest fails the build on an unmatched path (same as gen_manifest.py's bucket_for)", () => {
  const repo = initGitRepo();
  try {
    assert.throws(
      () =>
        runGitManifest(
          { range: "HEAD~1...HEAD", buckets: [{ id: "core", label: "Core", match: ["plugins/*/vcs/core/**"] }] },
          { repoRoot: repo }
        ),
      /no bucket matched "docs\/design\/note\.md"/
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("runGitManifest without a repoRoot is a clear error, not a crash", () => {
  assert.throws(() => runGitManifest({}, { repoRoot: undefined }), /no repo root available/);
});

// --- artifact-folder auto-exclude + explicit exclude[] ---------

function initGitRepoWithArtifactFolder() {
  const dir = tmpDir("explainer-gitmanifest-artifact-");
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", env });
  git("init", "-q");
  fs.writeFileSync(path.join(dir, "README.md"), "init\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");

  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "app.js"), "x = 1;\n");
  fs.mkdirSync(path.join(dir, "docs", "explainers", "demo", "pages"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "explainers", "demo", "contents.json"), "{}\n");
  fs.writeFileSync(path.join(dir, "docs", "explainers", "demo", "pages", "overview.html"), "<p>x</p>\n");
  git("add", "-A");
  git("commit", "-q", "-m", "add src + explainer source");
  return dir;
}

test("runGitManifest without the exclusion fails on the artifact's own folder (sanity: proves the auto-exclude below is doing real work)", () => {
  const repo = initGitRepoWithArtifactFolder();
  try {
    assert.throws(
      () =>
        runGitManifest(
          { range: "HEAD~1...HEAD", buckets: [{ id: "source", label: "Source", match: ["src/**"] }] },
          { repoRoot: repo }
        ),
      /no bucket matched "docs\/explainers\/demo/
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("runGitManifest auto-excludes the artifact's own folder (artifactDir, relative to repoRoot) — committed inside the range, no error, not in output", () => {
  const repo = initGitRepoWithArtifactFolder();
  try {
    const result = runGitManifest(
      { range: "HEAD~1...HEAD", buckets: [{ id: "source", label: "Source", match: ["src/**"] }] },
      { repoRoot: repo, artifactDir: path.join(repo, "docs", "explainers", "demo") }
    );
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].path, "src/app.js");
    assert.deepEqual(result.counts, { source: 1 });
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("runGitManifest accepts an explicit exclude: [globs] for other self-generated paths", () => {
  const repo = initGitRepoWithArtifactFolder();
  try {
    fs.mkdirSync(path.join(repo, "build-output"), { recursive: true });
    fs.writeFileSync(path.join(repo, "build-output", "generated.txt"), "x\n");
    execFileSync("git", ["add", "-A"], { cwd: repo });
    execFileSync("git", ["commit", "-q", "-m", "add build output"], {
      cwd: repo,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "Test",
        GIT_AUTHOR_EMAIL: "test@example.com",
        GIT_COMMITTER_NAME: "Test",
        GIT_COMMITTER_EMAIL: "test@example.com",
      },
    });

    const result = runGitManifest(
      {
        range: "HEAD~1...HEAD",
        buckets: [{ id: "source", label: "Source", match: ["src/**"] }],
        exclude: ["build-output/**"],
      },
      { repoRoot: repo, artifactDir: path.join(repo, "docs", "explainers", "demo") }
    );
    assert.equal(result.files.length, 0);
    assert.deepEqual(result.counts, {});
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("runGenerators (git-manifest, full wiring) auto-excludes the artifact's own folder via artifactDir", () => {
  const repo = initGitRepoWithArtifactFolder();
  try {
    const artifactDir = path.join(repo, "docs", "explainers", "demo");
    const result = runGenerators({
      contents: {
        generators: {
          manifest: {
            builtin: "git-manifest",
            range: "HEAD~1...HEAD",
            buckets: [{ id: "source", label: "Source", match: ["src/**"] }],
          },
        },
      },
      artifactDir,
      repoRoot: repo,
    });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    assert.equal(result.outputs.get("manifest").files.length, 1);
    assert.equal(result.outputs.get("manifest").files[0].path, "src/app.js");
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

// --- command generators ----------------------------------------

function writeScript(dir, name, content) {
  const scriptPath = path.join(dir, name);
  fs.writeFileSync(scriptPath, content);
  return scriptPath;
}

test("runCommandGenerator parses JSON stdout", () => {
  const dir = tmpDir("explainer-cmdgen-");
  try {
    const script = writeScript(dir, "gen.mjs", 'console.log(JSON.stringify({ a: 1, b: [2, 3] }));\n');
    const result = runCommandGenerator({ cmd: `node ${script}` }, { cwd: dir });
    assert.deepEqual(result, { a: 1, b: [2, 3] });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runCommandGenerator reports non-JSON stdout clearly", () => {
  const dir = tmpDir("explainer-cmdgen-");
  try {
    const script = writeScript(dir, "gen.mjs", 'console.log("not json");\n');
    assert.throws(() => runCommandGenerator({ cmd: `node ${script}` }, { cwd: dir }), /did not print JSON/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runCommandGenerator reports a non-zero exit clearly", () => {
  const dir = tmpDir("explainer-cmdgen-");
  try {
    const script = writeScript(dir, "gen.mjs", 'console.error("boom"); process.exit(1);\n');
    assert.throws(() => runCommandGenerator({ cmd: `node ${script}` }, { cwd: dir }), /exited 1/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runCommandGenerator honours timeout: a generator that runs too long is killed and reported", () => {
  const dir = tmpDir("explainer-cmdgen-");
  try {
    const script = writeScript(
      dir,
      "slow.mjs",
      'const start = Date.now(); while (Date.now() - start < 3000) {} console.log("{}");\n'
    );
    assert.throws(
      () => runCommandGenerator({ cmd: `node ${script}`, timeout: 1 }, { cwd: dir }),
      /timed out after 1s/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- runGenerators orchestration: approvals gate + caching ----

function approveCmd({ dir, id, cmd, cwd }) {
  const resolvedCwd = resolveGeneratorCwd({ cwd, repoRoot: dir, artifactDir: dir });
  const fingerprint = computeFingerprint({ cmd, cwd: resolvedCwd });
  recordApproval({ artifactDir: dir, id, cmd, cwd: resolvedCwd, fingerprint });
}

test("runGenerators stops an unapproved command generator with 'needs approval: <id> <cmd>'", () => {
  const dir = tmpDir("explainer-rungen-");
  try {
    const script = writeScript(dir, "gen.mjs", 'console.log(JSON.stringify({ ok: true }));\n');
    const cmd = `node ${script}`;
    const result = runGenerators({
      contents: { generators: { demo: { cmd, cwd: "." } } },
      artifactDir: dir,
      repoRoot: dir,
    });
    assert.equal(result.ok, false);
    assert.deepEqual(result.needsApproval, { id: "demo", cmd });
    assert.equal(result.errors[0], `needs approval: demo ${cmd}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runGenerators runs an approved command generator, caches its output, and reports timing/hash", () => {
  const dir = tmpDir("explainer-rungen-");
  try {
    const script = writeScript(dir, "gen.mjs", 'console.log(JSON.stringify({ ok: true }));\n');
    const cmd = `node ${script}`;
    approveCmd({ dir, id: "demo", cmd, cwd: "." });

    const result = runGenerators({
      contents: { generators: { demo: { cmd, cwd: "." } } },
      artifactDir: dir,
      repoRoot: dir,
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.outputs.get("demo"), { ok: true });
    assert.equal(result.report.length, 1);
    assert.equal(result.report[0].id, "demo");
    assert.equal(result.report[0].kind, "cmd");
    assert.match(result.report[0].hash, /^[0-9a-f]{64}$/);
    assert.equal(typeof result.report[0].ms, "number");

    const cachePath = path.join(dir, "dist", "gen", "demo.json");
    assert.ok(fs.existsSync(cachePath));
    assert.deepEqual(JSON.parse(fs.readFileSync(cachePath, "utf8")), { ok: true });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("editing the approved script re-requires approval, even with the same cmd string", () => {
  const dir = tmpDir("explainer-rungen-");
  try {
    const script = writeScript(dir, "gen.mjs", 'console.log(JSON.stringify({ v: 1 }));\n');
    const cmd = `node ${script}`;
    approveCmd({ dir, id: "demo", cmd, cwd: "." });

    let result = runGenerators({ contents: { generators: { demo: { cmd, cwd: "." } } }, artifactDir: dir, repoRoot: dir });
    assert.equal(result.ok, true);

    writeScript(dir, "gen.mjs", 'console.log(JSON.stringify({ v: 2 }));\n');
    result = runGenerators({ contents: { generators: { demo: { cmd, cwd: "." } } }, artifactDir: dir, repoRoot: dir });
    assert.equal(result.ok, false);
    assert.deepEqual(result.needsApproval, { id: "demo", cmd });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("changing the command string re-requires approval, even with the same script content", () => {
  const dir = tmpDir("explainer-rungen-");
  try {
    const script = writeScript(dir, "gen.mjs", 'console.log(JSON.stringify({ v: 1 }));\n');
    const cmd = `node ${script}`;
    approveCmd({ dir, id: "demo", cmd, cwd: "." });

    let result = runGenerators({ contents: { generators: { demo: { cmd, cwd: "." } } }, artifactDir: dir, repoRoot: dir });
    assert.equal(result.ok, true);

    const changedCmd = `node ${script} --flag`;
    result = runGenerators({
      contents: { generators: { demo: { cmd: changedCmd, cwd: "." } } },
      artifactDir: dir,
      repoRoot: dir,
    });
    assert.equal(result.ok, false);
    assert.deepEqual(result.needsApproval, { id: "demo", cmd: changedCmd });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("every build re-runs an approved generator — it is never skipped/memoized", () => {
  const dir = tmpDir("explainer-rungen-");
  try {
    const counterPath = path.join(dir, "counter.txt");
    fs.writeFileSync(counterPath, "0");
    const script = writeScript(
      dir,
      "gen.mjs",
      `import fs from "node:fs";
const counterPath = ${JSON.stringify(counterPath)};
const n = Number(fs.readFileSync(counterPath, "utf8")) + 1;
fs.writeFileSync(counterPath, String(n));
console.log(JSON.stringify({ runNumber: n }));
`
    );
    const cmd = `node ${script}`;
    approveCmd({ dir, id: "demo", cmd, cwd: "." });

    const contents = { generators: { demo: { cmd, cwd: "." } } };
    const first = runGenerators({ contents, artifactDir: dir, repoRoot: dir });
    const second = runGenerators({ contents, artifactDir: dir, repoRoot: dir });

    assert.equal(first.outputs.get("demo").runNumber, 1);
    assert.equal(second.outputs.get("demo").runNumber, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runGenerators runs the git-manifest builtin with no approval required", () => {
  const repo = initGitRepo();
  try {
    const result = runGenerators({
      contents: {
        generators: {
          manifest: {
            builtin: "git-manifest",
            range: "HEAD~1...HEAD",
            buckets: [
              { id: "core", label: "Core", match: ["plugins/*/vcs/core/**"] },
              { id: "docs", label: "Docs", match: ["docs/design/**"] },
            ],
          },
        },
      },
      artifactDir: repo,
      repoRoot: repo,
    });
    assert.equal(result.ok, true);
    assert.equal(result.outputs.get("manifest").files.length, 2);
    assert.equal(result.report[0].kind, "builtin");
    assert.equal(result.report[0].builtin, "git-manifest");
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});
