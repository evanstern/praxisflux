// sync-version.mjs is the lockstep stamper for every version file (marketplace.json, each
// plugin.json, action.yml's npx pin). The load-bearing invariants (TASK-69, after TASK-63's
// `--help` got stamped verbatim into all 11 files): argv is validated BEFORE any file is
// touched — only `--check` or one strict x.y.z is accepted; everything else (missing arg,
// --help-style flags, extra args, non-semver) exits 2 with usage on stderr and every version
// file byte-identical. Valid x.y.z stamps everything; --check exits 1 on drift, 0 when clean.
// A target at or below the current lockstep is deliberately allowed (repair/rollback stays
// possible; check-version-bump.mjs gates increases at PR time).
//
// The CLI resolves its repo from its own location, so each test runs a copy of the real
// script inside a throwaway fixture repo — a stamping regression can never touch this repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { USAGE } from "../scripts/sync-version.mjs";
import { PACKAGE_NAME } from "../scripts/build-npm.mjs";

const realRepo = join(dirname(fileURLToPath(import.meta.url)), "..");

/** A minimal lockstep repo at version 0.1.0 — two plugins, action.yml pin — running a COPY
 *  of the real sync-version.mjs (plus its import graph: build-npm.mjs, lib/cli.mjs). */
function fixture() {
  const repo = mkdtempSync(join(tmpdir(), "praxisflux-syncver-"));
  for (const f of ["scripts/sync-version.mjs", "scripts/build-npm.mjs", "lib/cli.mjs"]) {
    mkdirSync(join(repo, dirname(f)), { recursive: true });
    cpSync(join(realRepo, f), join(repo, f));
  }
  mkdirSync(join(repo, ".claude-plugin"), { recursive: true });
  writeFileSync(join(repo, ".claude-plugin", "marketplace.json"), JSON.stringify({
    name: "t", version: "0.1.0",
    plugins: [{ name: "alpha", source: "./alpha" }, { name: "beta", source: "./beta" }],
  }, null, 2) + "\n");
  for (const name of ["alpha", "beta"]) {
    mkdirSync(join(repo, name, ".claude-plugin"), { recursive: true });
    writeFileSync(join(repo, name, ".claude-plugin", "plugin.json"),
      JSON.stringify({ name, version: "0.1.0" }, null, 2) + "\n");
  }
  writeFileSync(join(repo, "action.yml"), `runs:\n  steps:\n    - run: npx ${PACKAGE_NAME}@0.1.0 run\n`);
  return repo;
}

/** Every file the lockstep stamps, as { repo-relative path: content }. */
function versionFiles(repo) {
  const files = {};
  for (const f of [".claude-plugin/marketplace.json", "alpha/.claude-plugin/plugin.json",
    "beta/.claude-plugin/plugin.json", "action.yml"])
    files[f] = readFileSync(join(repo, f), "utf8");
  return files;
}

function run(repo, argv) {
  try {
    const stdout = execFileSync(process.execPath, [join(repo, "scripts", "sync-version.mjs"), ...argv],
      { encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (e) {
    return { status: e.status, stdout: e.stdout, stderr: e.stderr };
  }
}

test("sync-version: bad argv is refused — usage, exit 2, every version file byte-identical", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const before = versionFiles(repo);
  const refusals = [
    [],                    // missing value (the removed bare no-arg sync mode)
    ["--help"],            // the TASK-63 incident argv
    ["-h"],
    ["1.2"],               // not strict x.y.z
    ["v1.2.3"],
    ["1.2.3-beta"],        // no prerelease support
    ["0.2.0", "extra"],    // extra args
    ["--check", "0.2.0"],
  ];
  for (const argv of refusals) {
    const { status, stdout, stderr } = run(repo, argv);
    assert.equal(status, 2, `[${argv.join(" ")}] must exit 2 (got ${status}): ${stdout}${stderr}`);
    assert.ok(stderr.includes(USAGE), `[${argv.join(" ")}] must print usage to stderr, got: ${stderr}`);
    assert.deepEqual(versionFiles(repo), before,
      `[${argv.join(" ")}] must leave every version file byte-identical`);
  }
});

test("sync-version: a strict x.y.z stamps marketplace, every plugin.json, and the action.yml pin", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const { status, stdout } = run(repo, ["0.2.0"]);
  assert.equal(status, 0, `valid stamp must exit 0: ${stdout}`);
  assert.match(stdout, /synced to 0\.2\.0/);
  assert.equal(JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8")).version, "0.2.0");
  for (const name of ["alpha", "beta"])
    assert.equal(JSON.parse(readFileSync(join(repo, name, ".claude-plugin", "plugin.json"), "utf8")).version, "0.2.0");
  assert.ok(readFileSync(join(repo, "action.yml"), "utf8").includes(`${PACKAGE_NAME}@0.2.0`));
});

test("sync-version: a target at or below the current lockstep is allowed (repair/rollback)", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const { status } = run(repo, ["0.0.9"]);
  assert.equal(status, 0, "a downgrade is the CLI's business to allow; the PR gate blocks non-increases");
  assert.equal(JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8")).version, "0.0.9");
});

test("sync-version: --check exits 0 when clean, 1 on drift, and never writes", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const clean = run(repo, ["--check"]);
  assert.equal(clean.status, 0, `clean --check must exit 0: ${clean.stderr}`);
  assert.match(clean.stdout, /all versions = 0\.1\.0/);

  writeFileSync(join(repo, "alpha", ".claude-plugin", "plugin.json"),
    JSON.stringify({ name: "alpha", version: "0.0.9" }, null, 2) + "\n");
  const before = versionFiles(repo);
  const drift = run(repo, ["--check"]);
  assert.equal(drift.status, 1, "--check on drift must exit 1");
  assert.match(drift.stderr, /version drift/);
  assert.deepEqual(versionFiles(repo), before, "--check must not write");
});
