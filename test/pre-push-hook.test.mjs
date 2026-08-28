// Tests for .githooks/pre-push (spec 057 R3): findings WARN and exit 0; a check that could
// not RUN still blocks.
//
// The hook is bash, so these spawn it for real against a fixture repo whose checks are stubbed
// by shadowing the scripts it calls. Testing it any other way would test a reimplementation of
// the hook rather than the hook.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/**
 * A repo carrying the real hook plus stub scripts standing in for the two checks. Each stub's
 * behavior is dictated by the (exit code, stdout) pair passed in, which is exactly the pair the
 * hook has to classify.
 */
function fixture({ bumpExit, bumpOut, freshExit, freshOut }) {
  const dir = mkdtempSync(join(tmpdir(), "pre-push-"));
  git(dir, "init", "-q", "-b", "main");
  mkdirSync(join(dir, ".githooks"), { recursive: true });
  mkdirSync(join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, "grounding-wiki", "gates"), { recursive: true });
  copyFileSync(join(repo, ".githooks", "pre-push"), join(dir, ".githooks", "pre-push"));
  chmodSync(join(dir, ".githooks", "pre-push"), 0o755);

  const stub = (path, exit, out) => {
    writeFileSync(join(dir, path), `console.log(${JSON.stringify(out)});\nprocess.exit(${exit});\n`);
  };
  stub("scripts/check-version-bump.mjs", bumpExit, bumpOut);
  stub("grounding-wiki/gates/cli.mjs", freshExit, freshOut);

  writeFileSync(join(dir, "seed"), "x");
  git(dir, "add", "-A");
  git(dir, "-c", "user.email=t@e.com", "-c", "user.name=t", "commit", "-qm", "seed");
  return dir;
}

const run = (dir) => {
  const r = spawnSync("bash", [join(dir, ".githooks", "pre-push")], { cwd: dir, encoding: "utf8" });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
};

test("pre-push: both checks green ⇒ exit 0, no findings printed", () => {
  const dir = fixture({
    bumpExit: 0, bumpOut: "no released surface changed — no bump required",
    freshExit: 0, freshOut: "OK: 40 note(s) fresh against their pinned sources",
  });
  const { status, out } = run(dir);
  assert.equal(status, 0);
  assert.match(out, /version bump vs origin\/main — ok/);
  assert.match(out, /grounding wiki freshness — ok/);
  assert.doesNotMatch(out, /not blocking/, "nothing to report ⇒ no findings block");
  assert.doesNotMatch(out, /expected mid-PR/, "no footer explaining redness on a clean tree");
  rmSync(dir, { recursive: true, force: true });
});

test("pre-push: real findings ⇒ WARN and exit 0 — the push proceeds", () => {
  const dir = fixture({
    bumpExit: 1, bumpOut: "version-bump check failed:\n  - released surface changed but the marketplace version did not increase",
    freshExit: 1, freshOut: "GATE FAILED (1 issue(s)):\n  - docs/wiki/a.md: STALE — sources changed since abc1234",
  });
  const { status, out } = run(dir);
  assert.equal(status, 0, "findings must never block an intermediate push");
  assert.match(out, /version bump vs origin\/main — findings \(not blocking\)/);
  assert.match(out, /grounding wiki freshness — findings \(not blocking\)/);
  // The findings themselves must reach the developer, not just a count.
  assert.match(out, /STALE — sources changed since abc1234/);
  // And the output must say mid-PR redness is expected, or it reads as a failure and trains
  // the same bypass reflex it exists to remove (R3).
  assert.match(out, /expected mid-PR/);
  assert.match(out, /ci\.yml, which blocks/);
  rmSync(dir, { recursive: true, force: true });
});

test("pre-push: a check that CANNOT RUN ⇒ blocks (fail closed, not a finding)", () => {
  // Exit 1 like a finding, but with none of the markers real output carries — the shape of a
  // crash, a stack trace, or a script that isn't there.
  const dir = fixture({
    bumpExit: 0, bumpOut: "no released surface changed — no bump required",
    freshExit: 1, freshOut: "ReferenceError: x is not defined\n    at file:///...",
  });
  const { status, out } = run(dir);
  assert.equal(status, 1, "an unrunnable check is a blocking problem, never a silent green");
  assert.match(out, /COULD NOT RUN/);
  assert.match(out, /blocking problem, not a finding/);
  rmSync(dir, { recursive: true, force: true });
});

test("pre-push: a usage error (exit 2) blocks — it is not a findings exit", () => {
  const dir = fixture({
    bumpExit: 2, bumpOut: "usage: check-version-bump.mjs --base <ref>",
    freshExit: 0, freshOut: "OK: 40 note(s) fresh against their pinned sources",
  });
  const { status, out } = run(dir);
  assert.equal(status, 1);
  assert.match(out, /COULD NOT RUN \(exit 2\)/);
  rmSync(dir, { recursive: true, force: true });
});

test("pre-push: one check failing to run still blocks even when the other has findings", () => {
  const dir = fixture({
    bumpExit: 1, bumpOut: "version-bump check failed:\n  - no bump",
    freshExit: 1, freshOut: "TypeError: cannot read properties of undefined",
  });
  const { status, out } = run(dir);
  assert.equal(status, 1);
  assert.match(out, /version bump vs origin\/main — findings/);
  assert.match(out, /grounding wiki freshness — COULD NOT RUN/);
  rmSync(dir, { recursive: true, force: true });
});
