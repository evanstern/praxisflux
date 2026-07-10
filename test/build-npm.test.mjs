// Tests for scripts/build-npm.mjs — carving the gate surface into the npm package (TASK-17).
// The second test is the integration proof: pack the staging tree, extract it like an
// installed dependency, and drive the bin through a node_modules/.bin symlink — the exact
// invocation path npx uses (and the path the lib/cli.mjs realpath guard exists for).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { buildNpm, PACKAGE_NAME } from "../scripts/build-npm.mjs";
import { stampNpxPin } from "../scripts/sync-version.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const mpVersion = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8")).version;

test("action.yml: npx pin names the package and is lockstep with the marketplace", () => {
  const { pins } = stampNpxPin(readFileSync(join(repo, "action.yml"), "utf8"), PACKAGE_NAME, mpVersion);
  assert.equal(pins.length, 1, `expected exactly one ${PACKAGE_NAME}@<version> pin in action.yml`);
  assert.equal(pins[0], mpVersion, "action.yml npx pin must match the marketplace version");
});

test("stampNpxPin: rewrites only the named package's pins and reports what it found", () => {
  const text = "npx --yes @praxis/gates@0.4.0 x\nuses: evanstern/praxis@v0.4.0\n@other/pkg@0.4.0";
  const { text: out, pins } = stampNpxPin(text, "@praxis/gates", "0.5.0");
  assert.deepEqual(pins, ["0.4.0"]);
  assert.match(out, /@praxis\/gates@0\.5\.0/);
  assert.match(out, /evanstern\/praxis@v0\.4\.0/, "the uses: example is not a pin and stays untouched");
  assert.match(out, /@other\/pkg@0\.4\.0/, "other packages' pins stay untouched");
  assert.deepEqual(stampNpxPin("no pin here", "@praxis/gates", "0.5.0").pins, []);
});

test("build-npm: staging tree is symlink-free, lockstep-versioned, and carries the contract files", () => {
  const out = join(mkdtempSync(join(tmpdir(), "build-npm-")), "npm");
  const pkg = buildNpm(out); // throws if any symlink survives the carve
  assert.equal(pkg.name, PACKAGE_NAME);
  assert.equal(pkg.version, mpVersion, "npm version must be lockstep with the marketplace");
  const onDisk = JSON.parse(readFileSync(join(out, "package.json"), "utf8"));
  assert.equal(onDisk.bin["praxis-gates"], "scripts/run-gates.mjs");
  for (const f of [
    "README.md",
    "LICENSE",
    "lib/cli.mjs",
    "spec-bridge/lib/spec-derive.mjs",
    "grounding-wiki/gates/freshness.mjs",
    "codebase-to-course/skills/codebase-to-course/references/validate.mjs",
  ])
    assert.ok(existsSync(join(out, f)), `${f} missing from staging tree`);
});

test("build-npm: packed tarball runs as a bin through node_modules/.bin with contract exit codes", () => {
  const work = mkdtempSync(join(tmpdir(), "build-npm-pack-"));
  const out = join(work, "npm");
  buildNpm(out);
  const packed = spawnSync("npm", ["pack", "--json", "--pack-destination", work], { cwd: out, encoding: "utf8" });
  assert.equal(packed.status, 0, packed.stderr);
  const tarball = join(work, JSON.parse(packed.stdout)[0].filename);

  // Lay the tarball out exactly as npm install would: node_modules/<name> + .bin symlink.
  const consumer = join(work, "consumer");
  const pkgDir = join(consumer, "node_modules", PACKAGE_NAME);
  mkdirSync(pkgDir, { recursive: true });
  const untar = spawnSync("tar", ["xzf", tarball, "--strip-components", "1", "-C", pkgDir], { encoding: "utf8" });
  assert.equal(untar.status, 0, untar.stderr);
  const bin = join(consumer, "node_modules", ".bin");
  mkdirSync(bin, { recursive: true });
  symlinkSync(join(pkgDir, "scripts", "run-gates.mjs"), join(bin, "praxis-gates"));
  const run = (...args) => spawnSync(process.execPath, [join(bin, "praxis-gates"), ...args], { encoding: "utf8" });

  // Usage contract: no gates -> exit 2, and the run-as-CLI guard must fire through the symlink.
  const usage = run();
  assert.equal(usage.status, 2, `expected usage-error exit, got ${usage.status}: ${usage.stdout}${usage.stderr}`);
  assert.match(usage.stderr, /no gates requested/);

  // A passing gate proves the whole packed import graph resolves (run-gates.mjs statically
  // imports every gate module, so one invocation loads all three plus their lib copies).
  const target = join(work, "target");
  mkdirSync(join(target, "backlog", "tasks"), { recursive: true });
  const ok = run("--gates", "spec-bridge", "--path", target);
  assert.equal(ok.status, 0, `spec-bridge via tarball failed: ${ok.stdout}${ok.stderr}`);
  assert.match(ok.stdout, /spec-bridge ok/);

  // And a failing gate keeps exit 1 with the fix named — the contract's failure half.
  mkdirSync(join(target, "docs", "course"), { recursive: true });
  const fail = run("--gates", "course", "--path", target);
  assert.equal(fail.status, 1, `expected gate-failure exit, got ${fail.status}`);
  assert.match(fail.stdout, /no index\.html/);
});
