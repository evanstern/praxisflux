// pdlc-config.test.mjs — spec 073 R2: the `.pdlc.json` configurator (C1 2026-10-15): config
// choice -> detection -> none, resolved through the registry so floors are enforced.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { definePort, createRegistry, PortError } from "../lib/port-registry.mjs";
import { CONFIG_FILE, loadPdlcConfig, configure, ConfigError } from "../lib/pdlc-config.mjs";

function scratch() {
  const root = mkdtempSync(join(tmpdir(), "pdlc-config-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

function writeConfig(root, value) {
  writeFileSync(join(root, CONFIG_FILE), JSON.stringify(value));
}

/** A demo port with a detecting "fake" adapter (satisfies the contract) and a
 *  non-detecting "broken" one (missing `set`), matching test/fixtures/ports-demo. */
function demoRegistry() {
  const registry = createRegistry();
  registry.addPort(definePort({ name: "demo", methods: ["get", "set"], floors: ["memory"] }));
  registry.addAdapter("demo", {
    name: "broken", capabilities: ["memory"], detect: () => false, get() {},
  });
  registry.addAdapter("demo", {
    name: "fake", capabilities: ["memory"], detect: () => true, get() {}, set() {},
  });
  return registry;
}

test("CONFIG_FILE is .pdlc.json", () => {
  assert.equal(CONFIG_FILE, ".pdlc.json");
});

// --- loadPdlcConfig -----------------------------------------------------------------------

test("loadPdlcConfig: absent file returns { ports: {} }", () => {
  const { root, done } = scratch();
  try {
    assert.deepEqual(loadPdlcConfig(root), { ports: {} });
  } finally { done(); }
});

test("loadPdlcConfig: malformed JSON throws ConfigError naming the file", () => {
  const { root, done } = scratch();
  try {
    writeFileSync(join(root, CONFIG_FILE), "{ not json");
    assert.throws(() => loadPdlcConfig(root), (e) => e instanceof ConfigError && e.message.includes(CONFIG_FILE));
  } finally { done(); }
});

test("loadPdlcConfig: a non-object ports value throws ConfigError", () => {
  const { root, done } = scratch();
  try {
    writeConfig(root, { ports: ["demo"] });
    assert.throws(() => loadPdlcConfig(root), ConfigError);
  } finally { done(); }
});

test("loadPdlcConfig: a non-object top level throws ConfigError", () => {
  const { root, done } = scratch();
  try {
    writeFileSync(join(root, CONFIG_FILE), "[1,2,3]");
    assert.throws(() => loadPdlcConfig(root), ConfigError);
  } finally { done(); }
});

// --- configure: config -> detected -> none -------------------------------------------------

test("configure: no file and no key falls back to detection, recording source: detected", () => {
  const { root, done } = scratch();
  try {
    const result = configure(demoRegistry(), root);
    assert.deepEqual(result, { demo: { adapter: "fake", source: "detected" } });
  } finally { done(); }
});

test("configure: an explicit config choice wins over detection", () => {
  const { root, done } = scratch();
  try {
    writeConfig(root, { ports: { demo: "fake" } });
    const result = configure(demoRegistry(), root);
    assert.deepEqual(result, { demo: { adapter: "fake", source: "config" } });
  } finally { done(); }
});

test("configure: no adapter detects and no config yields { adapter: null, source: \"none\" }", () => {
  const { root, done } = scratch();
  try {
    const registry = createRegistry();
    registry.addPort(definePort({ name: "demo" }));
    registry.addAdapter("demo", { name: "never", capabilities: [], detect: () => false });
    assert.deepEqual(configure(registry, root), { demo: { adapter: null, source: "none" } });
  } finally { done(); }
});

test("configure: an unknown port in .pdlc.json is a ConfigError, never a silent detect fallback", () => {
  const { root, done } = scratch();
  try {
    writeConfig(root, { ports: { ghost: "fake" } });
    assert.throws(
      () => configure(demoRegistry(), root),
      (e) => e instanceof ConfigError && e.port === "ghost" && /unknown port "ghost"/.test(e.message),
    );
  } finally { done(); }
});

test("configure: an adapter name not registered for that port is a ConfigError", () => {
  const { root, done } = scratch();
  try {
    writeConfig(root, { ports: { demo: "ghost-adapter" } });
    assert.throws(
      () => configure(demoRegistry(), root),
      (e) => e instanceof ConfigError && e.port === "demo" && e.adapter === "ghost-adapter",
    );
  } finally { done(); }
});

test("configure: a config-named adapter that fails its port's contract throws PortError from resolve", () => {
  const { root, done } = scratch();
  try {
    writeConfig(root, { ports: { demo: "broken" } });
    assert.throws(() => configure(demoRegistry(), root), PortError);
  } finally { done(); }
});
