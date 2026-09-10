import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { offload, loadConfig, validateSchema } from "../lib/structured-offload.mjs";

function startServer(handler) {
  const server = createServer((req, res) => {
    req.socket.on("error", () => {});
    res.on("error", () => {});
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => handler(req, res, body));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}
async function stopServer(server) {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}
function baseUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}
function scratchDir() {
  const dir = mkdtempSync(join(tmpdir(), "structured-offload-"));
  return { dir, done: () => rmSync(dir, { recursive: true, force: true }) };
}

const SCHEMA = {
  type: "object",
  required: ["label"],
  properties: { label: { type: "string", enum: ["a", "b", "c"] } },
};

function ollamaOk(value) {
  return JSON.stringify({ message: { content: JSON.stringify(value) } });
}
function openaiOk(value) {
  return JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] });
}

test("valid ollama response validates", async () => {
  const server = await startServer((req, res) => res.end(ollamaOk({ label: "a" })));
  try {
    const config = { endpoint: baseUrl(server), api: "ollama", model: "m" };
    const result = await offload({ prompt: "classify", schema: SCHEMA, config });
    assert.deepEqual(result, {
      ok: true,
      value: { label: "a" },
      residue: { backend: "ollama", model: "m", outcome: "validated", ms: result.residue.ms },
    });
    assert.equal(typeof result.residue.ms, "number");
  } finally { await stopServer(server); }
});

test("valid openai response validates", async () => {
  const server = await startServer((req, res) => res.end(openaiOk({ label: "b" })));
  try {
    const config = { endpoint: baseUrl(server), api: "openai", model: "m" };
    const result = await offload({ prompt: "classify", schema: SCHEMA, config });
    assert.equal(result.ok, true);
    assert.deepEqual(result.value, { label: "b" });
    assert.equal(result.residue.backend, "openai");
  } finally { await stopServer(server); }
});

test("request body carries the schema for both api values", async () => {
  let captured;
  let server = await startServer((req, res, body) => {
    captured = JSON.parse(body);
    res.end(ollamaOk({ label: "a" }));
  });
  try {
    await offload({ prompt: "x", schema: SCHEMA, config: { endpoint: baseUrl(server), api: "ollama", model: "m" } });
    assert.deepEqual(captured.format, SCHEMA);
    assert.equal(captured.model, "m");
  } finally { await stopServer(server); }

  server = await startServer((req, res, body) => {
    captured = JSON.parse(body);
    res.end(openaiOk({ label: "a" }));
  });
  try {
    await offload({ prompt: "x", schema: SCHEMA, config: { endpoint: baseUrl(server), api: "openai", model: "m" } });
    assert.deepEqual(captured.response_format.json_schema.schema, SCHEMA);
  } finally { await stopServer(server); }
});

test("prose response is invalid JSON and falls back", async () => {
  const server = await startServer((req, res) =>
    res.end(JSON.stringify({ message: { content: "sure, the answer is a" } })));
  try {
    const config = { endpoint: baseUrl(server), api: "ollama", model: "m" };
    const result = await offload({ prompt: "x", schema: SCHEMA, config });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "invalid-json");
    assert.equal(result.residue.outcome, "fallback");
  } finally { await stopServer(server); }
});

test("wrong enum value is a schema mismatch", async () => {
  const server = await startServer((req, res) => res.end(ollamaOk({ label: "zzz" })));
  try {
    const config = { endpoint: baseUrl(server), api: "ollama", model: "m" };
    const result = await offload({ prompt: "x", schema: SCHEMA, config });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "schema-mismatch");
  } finally { await stopServer(server); }
});

test("missing required property is a schema mismatch", async () => {
  const server = await startServer((req, res) => res.end(ollamaOk({})));
  try {
    const config = { endpoint: baseUrl(server), api: "ollama", model: "m" };
    const result = await offload({ prompt: "x", schema: SCHEMA, config });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "schema-mismatch");
  } finally { await stopServer(server); }
});

test("server sleeping past timeoutMs falls back to timeout", async () => {
  const server = await startServer((req, res) => {
    setTimeout(() => res.end(ollamaOk({ label: "a" })), 300);
  });
  try {
    const config = { endpoint: baseUrl(server), api: "ollama", model: "m" };
    const result = await offload({ prompt: "x", schema: SCHEMA, config, timeoutMs: 50 });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "timeout");
  } finally { await stopServer(server); }
});

test("closed port falls back to refused", async () => {
  const server = await startServer(() => {});
  const url = baseUrl(server);
  await stopServer(server);

  const config = { endpoint: url, api: "ollama", model: "m" };
  const result = await offload({ prompt: "x", schema: SCHEMA, config });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "refused");
});

test("no config file loads null and offload reports unconfigured", async () => {
  const s = scratchDir();
  try {
    assert.equal(loadConfig(s.dir), null);
    const result = await offload({ prompt: "x", schema: SCHEMA, config: loadConfig(s.dir) });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "unconfigured");
    assert.equal(result.residue.outcome, "fallback");
  } finally { s.done(); }
});

test("malformed config file loads null", () => {
  const s = scratchDir();
  try {
    mkdirSync(join(s.dir, ".claude"));
    writeFileSync(join(s.dir, ".claude", "structured-offload.json"), "{not json");
    assert.equal(loadConfig(s.dir), null);
  } finally { s.done(); }
});

test("valid config file loads and offload uses it end to end", async () => {
  const s = scratchDir();
  const server = await startServer((req, res) => res.end(ollamaOk({ label: "a" })));
  try {
    mkdirSync(join(s.dir, ".claude"));
    writeFileSync(
      join(s.dir, ".claude", "structured-offload.json"),
      JSON.stringify({ endpoint: baseUrl(server), api: "ollama", model: "m" }),
    );
    const config = loadConfig(s.dir);
    assert.ok(config);
    const result = await offload({ prompt: "x", schema: SCHEMA, config });
    assert.equal(result.ok, true);
  } finally { await stopServer(server); s.done(); }
});

test("residue is recorded on success and on fallback", async () => {
  const s = scratchDir();
  const residuePath = join(s.dir, "residue.jsonl");
  const server = await startServer((req, res) => res.end(ollamaOk({ label: "a" })));
  try {
    const config = { endpoint: baseUrl(server), api: "ollama", model: "m", residuePath };
    await offload({ prompt: "x", schema: SCHEMA, config });
    await offload({ prompt: "x", schema: SCHEMA, config: { ...config, api: "unknown" } });

    const lines = readFileSync(residuePath, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(lines.length, 2);
    assert.equal(lines[0].outcome, "validated");
    assert.equal(lines[1].outcome, "fallback");
    assert.equal(lines[1].reason, "unconfigured");
    for (const l of lines) assert.equal(typeof l.ms, "number");
  } finally { await stopServer(server); s.done(); }
});

test("validateSchema covers the documented subset directly", () => {
  assert.equal(validateSchema("a", { enum: ["a", "b"] }), true);
  assert.equal(validateSchema("z", { enum: ["a", "b"] }), false);
  assert.equal(validateSchema({ x: 1 }, { type: "object", required: ["x"] }), true);
  assert.equal(validateSchema({}, { type: "object", required: ["x"] }), false);
  assert.equal(validateSchema([1, 2], { type: "array", items: { type: "number" } }), true);
  assert.equal(validateSchema([1, "x"], { type: "array", items: { type: "number" } }), false);
  assert.equal(validateSchema(5, { type: "integer" }), true);
  assert.equal(validateSchema(5.5, { type: "integer" }), false);
  assert.equal(validateSchema(true, { type: "boolean" }), true);
});
