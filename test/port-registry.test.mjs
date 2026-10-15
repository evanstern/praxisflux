// port-registry.test.mjs — spec 073 R1: port contracts, adapter registration, resolve's
// method/floor enforcement, and filesystem discovery.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { definePort, createRegistry, discover, PortError } from "../lib/port-registry.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO_LIB = join(repo, "test", "fixtures", "ports-demo", "lib");

function scratch() {
  const root = mkdtempSync(join(tmpdir(), "port-registry-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

// --- definePort -------------------------------------------------------------------------

test("definePort: freezes the definition and defaults floors/methods", () => {
  const port = definePort({ name: "demo" });
  assert.deepEqual(port.methods, []);
  assert.deepEqual(port.floors, []);
  assert.equal(port.receiptDir, null);
  assert.throws(() => { port.methods.push("x"); }, TypeError);
  assert.throws(() => { port.name = "other"; });
});

test("definePort: requires a non-empty name", () => {
  assert.throws(() => definePort({ name: "" }), PortError);
  assert.throws(() => definePort({}), PortError);
});

// --- createRegistry: addPort / addAdapter / ports / adapters ----------------------------

test("createRegistry: addAdapter to an undeclared port throws PortError", () => {
  const registry = createRegistry();
  assert.throws(
    () => registry.addAdapter("ghost", { name: "x", capabilities: [] }),
    (e) => e instanceof PortError && /not registered/.test(e.message) && e.port === "ghost",
  );
});

test("createRegistry: adapters() on an unknown port returns [] rather than throwing", () => {
  const registry = createRegistry();
  assert.deepEqual(registry.adapters("ghost"), []);
});

test("createRegistry: ports/adapters round-trip in registration order", () => {
  const registry = createRegistry();
  const port = definePort({ name: "demo", methods: ["get"] });
  registry.addPort(port);
  registry.addAdapter("demo", { name: "b", capabilities: [], get() {} });
  registry.addAdapter("demo", { name: "a", capabilities: [], get() {} });
  assert.deepEqual(registry.ports().map((p) => p.name), ["demo"]);
  assert.deepEqual(registry.adapters("demo").map((a) => a.name), ["b", "a"]);
});

// --- resolve --------------------------------------------------------------------------

test("resolve: returns the adapter when every method and floor is satisfied", () => {
  const registry = createRegistry();
  registry.addPort(definePort({ name: "demo", methods: ["get", "set"], floors: ["memory"] }));
  const adapter = { name: "fake", capabilities: ["memory"], get() {}, set() {} };
  registry.addAdapter("demo", adapter);
  assert.equal(registry.resolve("demo", "fake"), adapter);
});

test("resolve: rejects a missing required method, naming port, adapter and the gap", () => {
  const registry = createRegistry();
  registry.addPort(definePort({ name: "demo", methods: ["get", "set"], floors: [] }));
  registry.addAdapter("demo", { name: "half", capabilities: [], get() {} });
  assert.throws(
    () => registry.resolve("demo", "half"),
    (e) => e instanceof PortError
      && e.port === "demo" && e.adapter === "half"
      && e.missing.includes('method "set"')
      && /port "demo"/.test(e.message) && /adapter "half"/.test(e.message) && /method "set"/.test(e.message),
  );
});

test("resolve: rejects a missing declared floor capability", () => {
  const registry = createRegistry();
  registry.addPort(definePort({ name: "demo", methods: [], floors: ["atomic"] }));
  registry.addAdapter("demo", { name: "bare", capabilities: [] });
  assert.throws(
    () => registry.resolve("demo", "bare"),
    (e) => e instanceof PortError && e.missing.includes('floor "atomic"') && /floor "atomic"/.test(e.message),
  );
});

test("resolve: names every gap at once when both a method and a floor are missing", () => {
  const registry = createRegistry();
  registry.addPort(definePort({ name: "demo", methods: ["get"], floors: ["atomic"] }));
  registry.addAdapter("demo", { name: "bare", capabilities: [] });
  assert.throws(
    () => registry.resolve("demo", "bare"),
    (e) => e.missing.length === 2 && e.missing.includes('method "get"') && e.missing.includes('floor "atomic"'),
  );
});

test("resolve: an unregistered adapter name is its own PortError", () => {
  const registry = createRegistry();
  registry.addPort(definePort({ name: "demo" }));
  assert.throws(
    () => registry.resolve("demo", "ghost"),
    (e) => e instanceof PortError && e.port === "demo" && e.adapter === "ghost" && /no adapter "ghost"/.test(e.message),
  );
});

test("resolve: an unregistered port is its own PortError", () => {
  const registry = createRegistry();
  assert.throws(() => registry.resolve("ghost", "x"), (e) => e instanceof PortError && e.port === "ghost");
});

// --- discover ---------------------------------------------------------------------------

test("discover: absent ports/ and adapters/ dirs yield an empty registry, not an error", async () => {
  const { root, done } = scratch();
  try {
    const registry = await discover(createRegistry(), join(root, "lib"));
    assert.deepEqual(registry.ports(), []);
  } finally {
    done();
  }
});

test("discover: loads port files in sorted name order regardless of directory listing order", async () => {
  const { root, done } = scratch();
  try {
    const portsDir = join(root, "lib", "ports");
    mkdirSync(portsDir, { recursive: true });
    writeFileSync(join(portsDir, "zeta.mjs"), 'export default { name: "zeta" };\n');
    writeFileSync(join(portsDir, "alpha.mjs"), 'export default { name: "alpha" };\n');
    const registry = await discover(createRegistry(), join(root, "lib"));
    assert.deepEqual(registry.ports().map((p) => p.name), ["alpha", "zeta"]);
  } finally {
    done();
  }
});

test("discover: registers adapters per port, missing a port's adapters/ dir is tolerated", async () => {
  const { root, done } = scratch();
  try {
    const libDir = join(root, "lib");
    mkdirSync(join(libDir, "ports"), { recursive: true });
    writeFileSync(join(libDir, "ports", "demo.mjs"), 'export default { name: "demo", methods: [], floors: [] };\n');
    mkdirSync(join(libDir, "ports"), { recursive: true });
    // "other" port has no adapters/ dir at all.
    writeFileSync(join(libDir, "ports", "other.mjs"), 'export default { name: "other", methods: [], floors: [] };\n');
    mkdirSync(join(libDir, "adapters", "demo"), { recursive: true });
    writeFileSync(
      join(libDir, "adapters", "demo", "fake.mjs"),
      'export default () => ({ name: "fake", capabilities: [] });\n',
    );
    const registry = await discover(createRegistry(), libDir);
    assert.deepEqual(registry.adapters("demo").map((a) => a.name), ["fake"]);
    assert.deepEqual(registry.adapters("other"), []);
  } finally {
    done();
  }
});

test("discover: the ports-demo fixture — fake resolves, broken fails on its missing method", async () => {
  const registry = await discover(createRegistry(), DEMO_LIB);
  assert.deepEqual(registry.ports().map((p) => p.name), ["demo"]);
  assert.deepEqual(registry.adapters("demo").map((a) => a.name), ["broken", "fake"]); // sorted file order

  const fake = registry.resolve("demo", "fake");
  fake.set("k", "v");
  assert.equal(fake.get("k"), "v");

  assert.throws(
    () => registry.resolve("demo", "broken"),
    (e) => e instanceof PortError && e.missing.includes('method "set"'),
  );
});
