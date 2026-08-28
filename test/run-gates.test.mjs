// Tests for scripts/run-gates.mjs — the CI consumption surface (action.yml's runner).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, symlinkSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

import { runGates, GATES } from "../scripts/run-gates.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const opts = (root, extra = {}) => ({ root, wikiDir: "docs/wiki", courseDir: "docs/course", ...extra });

test("run-gates: unknown or empty gate lists are usage errors, never silent skips", () => {
  assert.throws(() => runGates(["wiki-freshnes"], opts(repo)), /unknown gate "wiki-freshnes".*valid gates/s);
  assert.throws(() => runGates([], opts(repo)), /no gates requested/);
});

// This repo's OWN spec-bridge/wiki-freshness state used to be asserted here. It moved out of
// `node --test` in spec 057: it is a repo-STATE self-check, not a test of runGates' behavior,
// and mid-PR it is red BY CONSTRUCTION (the re-pin follows the source commit; a claimed card
// precedes its merged spec dir). In the per-commit path it blocked every commit until the work
// doctrine sequences last had landed — which trained `--no-verify` (2026-08-02, TASK-100/93) and
// amplified one red gate into ~50 findings, one per Done-eligible spec (2026-08-27, TASK-102).
// It now runs where end-state invariants belong — `.github/workflows/ci.yml`, asserted present
// by the test below — and by hand as:
//     node scripts/run-gates.mjs --gates spec-bridge,wiki-freshness --path .
// See docs/skill-patterns.md §4, "Repo-STATE self-checks gate the PR".

// The repo's own gate steps are hand-maintained in ci.yml; this is the drift check that keeps
// them there. Removing the self-check above without this would have silently dropped
// spec-bridge enforcement on praxisflux entirely — CI had a wiki-freshness step but NO
// spec-bridge step (spec 057's must-fix finding).
test("run-gates: ci.yml runs the repo's own spec-bridge and wiki-freshness self-checks", () => {
  const ci = readFileSync(join(repo, ".github", "workflows", "ci.yml"), "utf8");
  for (const gate of ["spec-bridge", "wiki-freshness"]) {
    assert.ok(
      new RegExp(`run:\\s*node scripts/run-gates\\.mjs --gates ${gate} --path \\.`).test(ci),
      `ci.yml no longer runs the repo's own ${gate} self-check — spec 057 moved it here from ` +
      `node --test; without a CI step this repo has NO ${gate} enforcement at all`,
    );
  }
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

// Regression: gate execution used to run inside the CLI's usage-error try/catch, so an
// exception thrown WHILE a gate ran exited 2 "usage error" instead of 1 — misdirecting CI
// consumers that branch on the documented 0/1/2 contract (docs/consuming-gates.md). A
// broken-symlink wiki note makes wiki-freshness throw ENOENT mid-run: that must be a gate
// failure (exit 1) naming the gate, never usage (exit 2).
test("run-gates: an exception thrown while a gate runs exits 1 (gate failure), never 2", () => {
  const dir = mkdtempSync(join(tmpdir(), "run-gates-crash-"));
  mkdirSync(join(dir, "docs", "wiki"), { recursive: true });
  writeFileSync(join(dir, "docs", "wiki", "INDEX.md"), "# index\n");
  symlinkSync(join(dir, "no-such-target.md"), join(dir, "docs", "wiki", "broken.md"));
  const r = spawnSync(
    process.execPath,
    [join(repo, "scripts", "run-gates.mjs"), "--gates", "wiki-freshness", "--path", dir],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 1, `expected gate-failure exit 1, got ${r.status}\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /\[wiki-freshness\] GATE FAILED/);
  assert.match(r.stdout, /gate "wiki-freshness" crashed while running: ENOENT/);
  assert.doesNotMatch(`${r.stdout}${r.stderr}`, /usage error/);
});

// The GATES map and action.yml's documented gate list are hand-maintained in parallel — this
// is the drift check tying them together, read from the real action.yml rather than a copy.
test("run-gates: GATES registry and action.yml agree on the gate names", () => {
  const action = readFileSync(join(repo, "action.yml"), "utf8");
  const doc = action.match(/Comma-separated gates to run: ([^.]+)\./);
  assert.ok(doc, "action.yml no longer documents the gate list in the gates input description");
  assert.deepEqual(Object.keys(GATES).sort(), doc[1].split(",").map((s) => s.trim()).sort());
});

// Regression: the run-as-CLI guard compared import.meta.url (symlink-resolved by Node)
// against argv[1] (as typed), so invoking the runner through a symlinked checkout
// (~/projects -> Claude/Code) ran zero gates and exited 0 — a silent pass. lib/cli.mjs
// realpaths both sides; the CLI must now behave identically through any invocation path.
test("run-gates: CLI fires through a symlinked checkout — no silent zero-gate pass", () => {
  const dir = mkdtempSync(join(tmpdir(), "run-gates-symlink-"));
  const link = join(dir, "praxisflux-link");
  symlinkSync(repo, link);
  const runner = (base) =>
    spawnSync(process.execPath, [join(base, "scripts", "run-gates.mjs"), "--gates", "bogus"], { encoding: "utf8" });
  for (const base of [link, repo]) {
    const r = runner(base);
    assert.equal(r.status, 2, `via ${base}: expected usage-error exit, got ${r.status}`);
    assert.match(r.stderr, /unknown gate "bogus"/);
  }
});
