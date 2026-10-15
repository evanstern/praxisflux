// contract-harness.test.mjs — spec 073 R4: runContractSuite proved against the demo port
// fixture. Each case runs a *generated* driver script in a temp dir OUTSIDE the repo tree
// (not a new file under test/) and spawns `node` on it directly (not `--test`) — node:test's
// describe/test work standalone, reporting via TAP and the process exit code. A permanent
// fixture file here would itself be swept into node's default "any file under a test/
// directory" discovery and its deliberately-failing case would fail THIS file's own suite.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { removeFixtureDir } from "./fixture-teardown.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO_LIB = join(repo, "test", "fixtures", "ports-demo", "lib");
const url = (p) => pathToFileURL(p).href;

const HARNESS = url(join(repo, "lib", "contract-harness.mjs"));
const DEMO_PORT = url(join(DEMO_LIB, "ports", "demo.mjs"));
const FAKE = url(join(DEMO_LIB, "adapters", "demo", "fake.mjs"));
const BROKEN = url(join(DEMO_LIB, "adapters", "demo", "broken.mjs"));

/** Write `source` as a driver script in a fresh scratch dir (outside test/) and run it with
 *  plain `node` (standalone node:test usage). Returns the spawn result; cleans up the dir. */
function runDriver(source) {
  const dir = mkdtempSync(join(tmpdir(), "contract-harness-driver-"));
  try {
    const script = join(dir, "driver.mjs");
    writeFileSync(script, source);
    return spawnSync("node", [script], { encoding: "utf8" });
  } finally {
    removeFixtureDir(dir);
  }
}

test("runContractSuite: the demo suite passes against the fake adapter and cleans up its temp root", () => {
  const r = runDriver(`
    import { existsSync } from "node:fs";
    import demoPort from "${DEMO_PORT}";
    import fakeFactory from "${FAKE}";
    import { runContractSuite } from "${HARNESS}";
    runContractSuite({
      port: demoPort,
      factories: { fake: fakeFactory },
      cases: [
        { name: "set then get round-trips", run(adapter) {
            adapter.set("k", "v");
            if (adapter.get("k") !== "v") throw new Error("round-trip failed");
          } },
        { name: "ctx.root is a real temp directory during the case", run(adapter, ctx) {
            if (!existsSync(ctx.root)) throw new Error("ctx.root missing during run");
            console.log("ROOT:" + ctx.root);
          } },
      ],
    });
  `);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const m = r.stdout.match(/ROOT:(\S+)/);
  assert.ok(m, `expected the driver to print the temp root it was given:\n${r.stdout}${r.stderr}`);
  assert.equal(existsSync(m[1]), false, "the harness should have removed the temp root after the case");
});

test("runContractSuite: the broken adapter fails validation, naming the missing method", () => {
  const r = runDriver(`
    import demoPort from "${DEMO_PORT}";
    import brokenFactory from "${BROKEN}";
    import { runContractSuite } from "${HARNESS}";
    runContractSuite({ port: demoPort, factories: { broken: brokenFactory }, cases: [] });
  `);
  assert.notEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /method "set"/);
});
