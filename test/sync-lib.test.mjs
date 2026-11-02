// sync-lib.mjs stamps each plugin's vendored lib/ copy from repo-root lib/ and reports drift.
// Load-bearing: the repo's own ten copies must already be in sync (this is what makes
// `node scripts/sync-lib.mjs --check` a real pre-commit/CI gate, not a vacuous pass), and a
// fixture repo with one modified copy must be caught.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { driftReport, syncLib } from "../scripts/sync-lib.mjs";

test("sync-lib: the repo's own plugin lib/ copies are in sync", () => {
  assert.deepEqual(driftReport(), []);
});

/** A minimal two-plugin fixture repo: repo-root lib/ plus alpha/'s own (initially synced) copy. */
function fixture() {
  const repo = mkdtempSync(join(tmpdir(), "praxisflux-sync-lib-"));
  mkdirSync(join(repo, ".claude-plugin"), { recursive: true });
  writeFileSync(join(repo, ".claude-plugin", "marketplace.json"), JSON.stringify({
    name: "t", version: "0.1.0", plugins: [{ name: "alpha", source: "./alpha" }],
  }));
  mkdirSync(join(repo, "lib"));
  writeFileSync(join(repo, "lib", "chassis.mjs"), "export const ok = true;\n");
  mkdirSync(join(repo, "alpha", "lib"), { recursive: true });
  writeFileSync(join(repo, "alpha", "lib", "chassis.mjs"), "export const ok = true;\n");
  return repo;
}

test("sync-lib: a modified copy is reported as drift, and syncLib fixes it", () => {
  const repo = fixture();
  try {
    writeFileSync(join(repo, "alpha", "lib", "chassis.mjs"), "export const ok = false; // tampered\n");
    const problems = driftReport(repo);
    assert.ok(problems.some((p) => p.includes("alpha/lib/chassis.mjs")), `expected drift reported, got: ${problems}`);

    syncLib(repo);
    assert.deepEqual(driftReport(repo), []);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test("sync-lib: a missing file in the plugin's copy is reported", () => {
  const repo = fixture();
  try {
    writeFileSync(join(repo, "lib", "extra.mjs"), "export const extra = true;\n");
    const problems = driftReport(repo);
    assert.ok(problems.some((p) => p.includes("missing extra.mjs")), `expected missing-file report, got: ${problems}`);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});
