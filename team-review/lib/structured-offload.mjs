// structured-offload.mjs — schema-validated calls to a local model, fail-soft always.
//
// `offload({ prompt, schema, config, timeoutMs })` asks a local Ollama or
// OpenAI-compatible endpoint to answer `prompt`, constrained to `schema` at the backend
// (Ollama `format`, OpenAI-compatible `response_format: json_schema`) so the model is
// structurally prevented from returning prose. The result is validated again on this
// side against the same schema. NEVER throws: every failure path — unset config,
// timeout, connection refused, non-2xx, invalid JSON, schema mismatch — resolves to
// `{ ok: false, reason, residue }` and the caller does the work in-session, exactly as
// if this module did not exist.
//
// `config` is loaded by `loadConfig(root)` from `<root>/.claude/structured-offload.json`
// (absent/unreadable/malformed -> null -> `reason: 'unconfigured'`), kept separate from
// `offload` so tests can hand it a stub-server config directly without touching disk.
//
// Config shape: `{ endpoint, api: 'ollama'|'openai', model, timeoutMs?, residuePath? }`.
//
// Schema checker (minimal subset — extend only when a consumer needs more):
//   - `type`: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean'
//   - `required`: array of property names that must exist on an object value
//   - `properties`: per-key sub-schemas, checked recursively
//   - `enum`: value must be one of the listed members
//   - `items`: sub-schema every array element must satisfy
// ponytail: full JSON Schema (oneOf/anyOf/patternProperties/formats/…) is not
// implemented; the checked subset is what closed-enum/path-lookup callers need.
//
// `residue`: `{ backend, model, outcome: 'validated'|'fallback', reason?, ms }`,
// returned on every call and appended as a JSON line to `config.residuePath` when set.

import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

/** Load and validate the config file, or null on any absence/parse/shape failure. */
export function loadConfig(root) {
  try {
    const cfg = JSON.parse(readFileSync(join(root, ".claude", "structured-offload.json"), "utf8"));
    if (!cfg || typeof cfg !== "object") return null;
    if (!cfg.endpoint || !["ollama", "openai"].includes(cfg.api) || !cfg.model) return null;
    return cfg;
  } catch {
    return null;
  }
}

function isTimeoutError(err) {
  return err?.name === "TimeoutError" || err?.name === "AbortError";
}

function buildRequest(config, prompt, schema) {
  const messages = [{ role: "user", content: prompt }];
  if (config.api === "ollama") {
    return { path: "/api/chat", body: { model: config.model, messages, format: schema, stream: false } };
  }
  return {
    path: "/v1/chat/completions",
    body: {
      model: config.model,
      messages,
      response_format: { type: "json_schema", json_schema: { name: "offload_response", strict: true, schema } },
    },
  };
}

function extractContent(api, data) {
  return api === "ollama" ? data?.message?.content : data?.choices?.[0]?.message?.content;
}

/** The minimal schema subset documented in the module header. */
export function validateSchema(value, schema) {
  if (!schema) return true;
  if (schema.enum) return schema.enum.includes(value);
  switch (schema.type) {
    case "object": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
      for (const key of schema.required || []) if (!(key in value)) return false;
      if (schema.properties) {
        for (const [key, sub] of Object.entries(schema.properties)) {
          if (key in value && !validateSchema(value[key], sub)) return false;
        }
      }
      return true;
    }
    case "array":
      return Array.isArray(value) && (!schema.items || value.every((v) => validateSchema(v, schema.items)));
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    default:
      return true;
  }
}

/** Async, never-throwing: see module header for the full contract. */
export async function offload({ prompt, schema, config, timeoutMs } = {}) {
  const start = Date.now();
  const backend = config?.api;
  const model = config?.model;

  function finish(result) {
    const residue = { backend, model, outcome: result.ok ? "validated" : "fallback", ms: Date.now() - start };
    if (!result.ok) residue.reason = result.reason;
    if (config?.residuePath) {
      try { appendFileSync(config.residuePath, JSON.stringify(residue) + "\n"); } catch { /* residue is best-effort */ }
    }
    return { ...result, residue };
  }
  const fail = (reason) => finish({ ok: false, reason });

  if (!config || !config.endpoint || !["ollama", "openai"].includes(config.api) || !config.model) {
    return fail("unconfigured");
  }

  const { path, body } = buildRequest(config, prompt, schema);
  let res;
  try {
    res = await fetch(new URL(path, config.endpoint), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs ?? config.timeoutMs ?? 30000),
    });
  } catch (err) {
    return fail(isTimeoutError(err) ? "timeout" : "refused");
  }
  if (!res.ok) return fail("http-error");

  let data;
  try { data = await res.json(); } catch { return fail("invalid-json"); }

  let value;
  try { value = JSON.parse(extractContent(config.api, data)); } catch { return fail("invalid-json"); }

  if (!validateSchema(value, schema)) return fail("schema-mismatch");
  return finish({ ok: true, value });
}
