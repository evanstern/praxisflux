// Tests for scripts/run-gates.mjs — the CI consumption surface (action.yml's runner).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import { runGates, GATES } from "../scripts/run-gates.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const opts = (root, extra = {}) => ({ root, wikiDir: "docs/wiki", courseDir: "docs/course", ...extra });

test("run-gates: unknown or empty gate lists are usage errors, never silent skips", () => {
  assert.throws(() => runGates(["wiki-freshnes"], opts(repo)), /unknown gate "wiki-freshnes".*valid gates/s);
  assert.throws(() => runGates([], opts(repo)), /no gates requested/);
});

test("run-gates: the praxis repo itself passes spec-bridge and wiki-freshness", () => {
  const results = runGates(["spec-bridge", "wiki-freshness"], opts(repo));
  for (const r of results) assert.deepEqual(r.problems, [], `${r.gate}: ${r.problems.join("; ")}`);
  assert.match(results[1].ok, /note\(s\) fresh/);
});

test("run-gates: course gate failure names the fix (missing index.html)", () => {
  const dir = mkdtempSync(join(tmpdir(), "run-gates-"));
  mkdirSync(join(dir, "docs", "course"), { recursive: true });
  const [r] = runGates(["course"], opts(dir));
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /no index\.html .* run build\.sh/);
});

test("run-gates: wiki-freshness on a shallow clone fails with the fetch-depth fix", () => {
  const src = mkdtempSync(join(tmpdir(), "run-gates-src-"));
  const git = (cwd, ...a) => execFileSync("git", a, { cwd, stdio: "pipe" });
  git(src, "init", "-q");
  git(src, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "one");
  git(src, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "two");
  const dst = mkdtempSync(join(tmpdir(), "run-gates-shallow-"));
  git(dst, "clone", "-q", "--depth", "1", `file://${src}`, "clone");
  const [r] = runGates(["wiki-freshness"], opts(join(dst, "clone")));
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /shallow clone.*fetch-depth: 0/);
});

test("run-gates: GATES registry and action.yml agree on the gate names", () => {
  assert.deepEqual(Object.keys(GATES).sort(), ["course", "spec-bridge", "wiki-freshness"]);
});
