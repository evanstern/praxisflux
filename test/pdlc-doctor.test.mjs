// pdlc-doctor.test.mjs — spec 073 R5: the `pdlc` CLI's `doctor` subcommand, both as a
// function (fast, direct) and through the real CLI process (JSON-on-stdout, exit codes,
// restricted PATH).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { doctor } from "../pdlc/scripts/pdlc.mjs";
import { removeFixtureDir } from "./fixture-teardown.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO_LIB = join(repo, "test", "fixtures", "ports-demo", "lib");
const PDLC_CLI = join(repo, "pdlc", "scripts", "pdlc.mjs");

function scratch() {
  const root = mkdtempSync(join(tmpdir(), "pdlc-doctor-"));
  return { root, done: () => removeFixtureDir(root) };
}

// --- doctor() against the real repo (no ports registered yet) ----------------------------

test("doctor: the real repo has no ports registered yet -> ports: []", async () => {
  const report = await doctor({ root: repo });
  assert.equal(report.schema, 1);
  assert.equal(report.root, repo);
  assert.deepEqual(report.ports, []);
  assert.equal(report.config.file, ".pdlc.json");
  assert.equal(report.config.present, false);
  assert.equal(report.plantReceipt.file, ".pdlc");
  assert.equal(report.plantReceipt.present, true);
});

// --- doctor() against the demo fixture: config, detection, unrunnable, malformed config ---

test("doctor: an explicit .pdlc.json choice reports source: config and canRun from probe", async () => {
  const { root, done } = scratch();
  try {
    writeFileSync(join(root, ".pdlc.json"), JSON.stringify({ ports: { demo: "fake" } }));
    const report = await doctor({ root, libDir: DEMO_LIB });
    assert.deepEqual(report.ports, [
      { port: "demo", adapter: "fake", source: "config", canRun: true, reason: null },
    ]);
    assert.equal(report.config.present, true);
  } finally { done(); }
});

test("doctor: no config falls back to detection, reporting source: detected", async () => {
  const { root, done } = scratch();
  try {
    const report = await doctor({ root, libDir: DEMO_LIB });
    assert.deepEqual(report.ports, [
      { port: "demo", adapter: "fake", source: "detected", canRun: true, reason: null },
    ]);
    assert.equal(report.config.present, false);
  } finally { done(); }
});

test("doctor: an adapter whose probe fails reports canRun: false with its reason", async () => {
  const { root, done } = scratch();
  try {
    const libDir = join(root, "lib");
    mkdirSync(join(libDir, "ports"), { recursive: true });
    mkdirSync(join(libDir, "adapters", "demo"), { recursive: true });
    writeFileSync(
      join(libDir, "ports", "demo.mjs"),
      `import { definePort } from ${JSON.stringify(join(repo, "lib", "port-registry.mjs"))};\n` +
        `export default definePort({ name: "demo", methods: ["get"], floors: [] });\n`,
    );
    writeFileSync(
      join(libDir, "adapters", "demo", "unrunnable.mjs"),
      `export default function unrunnableAdapter() {\n` +
        `  return { name: "unrunnable", capabilities: [], detect: () => true,\n` +
        `    probe: () => ({ ok: false, reason: "fixture binary not on PATH" }), get() { return null; } };\n` +
        `}\n`,
    );
    const report = await doctor({ root, libDir });
    assert.deepEqual(report.ports, [
      { port: "demo", adapter: "unrunnable", source: "detected", canRun: false, reason: "fixture binary not on PATH" },
    ]);
  } finally { done(); }
});

test("doctor: no adapter detects and no config -> adapter: null, canRun: false", async () => {
  const { root, done } = scratch();
  try {
    const libDir = join(root, "lib");
    mkdirSync(join(libDir, "ports"), { recursive: true });
    mkdirSync(join(libDir, "adapters", "demo"), { recursive: true });
    writeFileSync(
      join(libDir, "ports", "demo.mjs"),
      `import { definePort } from ${JSON.stringify(join(repo, "lib", "port-registry.mjs"))};\n` +
        `export default definePort({ name: "demo", methods: [], floors: [] });\n`,
    );
    writeFileSync(
      join(libDir, "adapters", "demo", "never.mjs"),
      `export default function neverAdapter() {\n` +
        `  return { name: "never", capabilities: [], detect: () => false, probe: () => ({ ok: true }) };\n` +
        `}\n`,
    );
    const report = await doctor({ root, libDir });
    assert.deepEqual(report.ports, [
      { port: "demo", adapter: null, source: "none", canRun: false, reason: "no adapter configured or detected" },
    ]);
  } finally { done(); }
});

test("doctor: malformed .pdlc.json rejects with a ConfigError naming the file", async () => {
  const { root, done } = scratch();
  try {
    writeFileSync(join(root, ".pdlc.json"), "{ not json");
    await assert.rejects(() => doctor({ root, libDir: DEMO_LIB }), (e) => e.message.includes(".pdlc.json"));
  } finally { done(); }
});

// --- the real CLI process: JSON stdout, exit codes --------------------------------------

test("CLI: `pdlc.mjs doctor` against the real repo prints JSON with ports: [] and exits 0", () => {
  const r = spawnSync("node", [PDLC_CLI, "doctor", "--root", repo], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const report = JSON.parse(r.stdout);
  assert.deepEqual(report.ports, []);
});

test("CLI: `pdlc.mjs doctor --root <fixture> --lib-dir <demo lib>` reports the demo port via detection", () => {
  const { root, done } = scratch();
  try {
    const r = spawnSync("node", [PDLC_CLI, "doctor", "--root", root, "--lib-dir", DEMO_LIB], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const report = JSON.parse(r.stdout);
    assert.deepEqual(report.ports, [
      { port: "demo", adapter: "fake", source: "detected", canRun: true, reason: null },
    ]);
  } finally { done(); }
});

test("CLI: a malformed .pdlc.json exits 1 with { error } JSON on stdout", () => {
  const { root, done } = scratch();
  try {
    writeFileSync(join(root, ".pdlc.json"), "{ not json");
    const r = spawnSync("node", [PDLC_CLI, "doctor", "--root", root, "--lib-dir", DEMO_LIB], { encoding: "utf8" });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    const parsed = JSON.parse(r.stdout);
    assert.match(parsed.error, /\.pdlc\.json/);
  } finally { done(); }
});

test("CLI: an unknown subcommand exits 2 with a usage message on stderr", () => {
  const r = spawnSync("node", [PDLC_CLI, "bogus"], { encoding: "utf8" });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /usage: pdlc\.mjs doctor/);
});

test("CLI: no subcommand exits 2 with a usage message", () => {
  const r = spawnSync("node", [PDLC_CLI], { encoding: "utf8" });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /usage: pdlc\.mjs doctor/);
});

// --- doctor runs with PATH reduced to only the dirs holding git and node -----------------

test("CLI: doctor runs with PATH reduced to only the dirs holding git and node", () => {
  const gitBin = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const nodeBin = process.execPath;
  const reducedPath = [dirname(gitBin), dirname(nodeBin)].join(":");
  const r = spawnSync(nodeBin, [PDLC_CLI, "doctor", "--root", repo], {
    encoding: "utf8",
    env: { PATH: reducedPath },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const report = JSON.parse(r.stdout);
  assert.equal(report.schema, 1);
  assert.deepEqual(report.ports, []);
});
