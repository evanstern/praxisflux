// build.mjs packages plugins into dist/. The load-bearing invariants: a --plugin build
// cleans ONLY its target (sibling packaged copies and dist/npm survive — a full wipe to
// rebuild one plugin was the TASK-66 bug), a full build starts from a clean dist/, the
// copied lib symlink is dereferenced, and a bare `--plugin` is a usage error, not a
// TypeError from targets=[undefined].
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { buildPlugins, USAGE } from "../scripts/build.mjs";

const script = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "build.mjs");

/** A minimal two-plugin repo: alpha/ and beta/ each carry a file + the lib -> ../lib symlink. */
function fixture() {
  const repo = mkdtempSync(join(tmpdir(), "praxisflux-build-"));
  mkdirSync(join(repo, ".claude-plugin"), { recursive: true });
  writeFileSync(join(repo, ".claude-plugin", "marketplace.json"), JSON.stringify({
    name: "t", version: "0.1.0",
    plugins: [{ name: "alpha", source: "./alpha" }, { name: "beta", source: "./beta" }],
  }));
  mkdirSync(join(repo, "lib"));
  writeFileSync(join(repo, "lib", "chassis.mjs"), "export const ok = true;\n");
  for (const name of ["alpha", "beta"]) {
    mkdirSync(join(repo, name));
    writeFileSync(join(repo, name, "hello.txt"), `${name}\n`);
    symlinkSync("../lib", join(repo, name, "lib"));
  }
  return repo;
}

test("build: a full build packages every plugin with lib dereferenced", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  buildPlugins(repo, "all");
  for (const name of ["alpha", "beta"]) {
    assert.ok(existsSync(join(repo, "dist", name, "hello.txt")), `dist/${name} must be packaged`);
    const lib = join(repo, "dist", name, "lib");
    assert.ok(lstatSync(lib).isDirectory() && !lstatSync(lib).isSymbolicLink(),
      `dist/${name}/lib must be a real directory`);
    assert.ok(existsSync(join(lib, "chassis.mjs")), `dist/${name}/lib must contain the chassis`);
  }
});

test("build: --plugin rebuilds only its target — siblings and dist/npm survive, stale target files don't", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  buildPlugins(repo, "all");

  // Other dist output that a scoped rebuild must NOT destroy.
  writeFileSync(join(repo, "dist", "alpha", "hand-mark.txt"), "survives a beta rebuild\n");
  mkdirSync(join(repo, "dist", "npm"), { recursive: true });
  writeFileSync(join(repo, "dist", "npm", "package.json"), "{}\n");
  // Stale residue inside the target itself must be cleaned, not merged over.
  writeFileSync(join(repo, "dist", "beta", "stale.txt"), "gone after rebuild\n");

  buildPlugins(repo, "beta");
  assert.ok(existsSync(join(repo, "dist", "alpha", "hand-mark.txt")),
    "--plugin beta must not touch dist/alpha");
  assert.ok(existsSync(join(repo, "dist", "npm", "package.json")),
    "--plugin beta must not touch dist/npm");
  assert.ok(!existsSync(join(repo, "dist", "beta", "stale.txt")),
    "the target's own dist dir must be cleaned before repackaging");
  assert.equal(readFileSync(join(repo, "dist", "beta", "hello.txt"), "utf8"), "beta\n");
});

test("build: a full build still starts from a clean dist/", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  buildPlugins(repo, "all");
  mkdirSync(join(repo, "dist", "npm"), { recursive: true });
  buildPlugins(repo, "all");
  assert.ok(!existsSync(join(repo, "dist", "npm")), "a full build wipes dist/ first");
});

test("build: an unknown plugin throws before anything is cleaned", (t) => {
  const repo = fixture();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  buildPlugins(repo, "all");
  writeFileSync(join(repo, "dist", "alpha", "hand-mark.txt"), "x\n");
  assert.throws(() => buildPlugins(repo, "nope"), /no such plugin: nope/);
  assert.ok(existsSync(join(repo, "dist", "alpha", "hand-mark.txt")),
    "a failed build must not have cleaned anything");
});

test("build CLI: --plugin without a value is a usage error, not a crash", () => {
  for (const argv of [["--plugin"], ["--plugin", "--x"]]) {
    let status = 0, out = "";
    try { execFileSync(process.execPath, [script, ...argv], { encoding: "utf8" }); }
    catch (e) { status = e.status; out = `${e.stdout}${e.stderr}`; }
    assert.equal(status, 2, `bare --plugin must exit 2 (got ${status}): ${out}`);
    assert.ok(out.includes(USAGE), `must print usage, got: ${out}`);
    assert.doesNotMatch(out, /TypeError/, "no argv TypeError");
  }
});
