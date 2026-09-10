# 063 — plan

**Constitution:** absent on this host (`.specify/` is not installed, so there is no
`memory/constitution.md`). Per the sweep's plan-step rule, this plan is checked against
the project's grounding docs instead — `CLAUDE.md` (chassis conventions, releasing),
`docs/principles.md`, `docs/releasing.md`, `docs/wiki/chassis.md` and
`docs/wiki/test-suite.md` (what the chassis and suite conventions require). The
zero-dependency chassis rule and the version-bump rule directly shape the phases below.

## Approach

One new zero-dependency chassis module, `lib/structured-offload.mjs`, using only Node
builtins (`fetch` is global since Node 18; no HTTP client dependency). The module is a
pure seam: no consumer changes anywhere in this task.

### Contract

```js
offload({ prompt, schema, config, timeoutMs = 30000 })
  -> { ok: true,  value: <validated object>, residue }
   | { ok: false, reason: 'unconfigured'|'timeout'|'refused'|'http-error'
                        |'invalid-json'|'schema-mismatch', residue }
```

- Never throws for any reachable input; `ok: false` IS the fallback signal. The caller's
  contract: on `ok: false`, do the work in-session, exactly as today.
- `residue`: `{ backend, model, outcome, reason?, ms }` — returned on every call and
  appended as a JSON line to a caller-supplied `residuePath` when the config sets one
  (gitignored by default; measurement is TASK-0127's job, the seam only records).

### Config: `.claude/structured-offload.json`

Beside `.claude/model-tiers.json`, same precedent — model routing is config, not code:

```json
{
  "endpoint": "http://localhost:11434",
  "api": "ollama",
  "model": "deepseek-r1:latest",
  "timeoutMs": 30000,
  "residuePath": ".claude/structured-offload-residue.jsonl"
}
```

- File absent, unreadable, or malformed → `reason: 'unconfigured'` → fallback. Absent
  config is byte-identical to today (AC #4) because no caller exists yet and future
  callers see `ok: false` and proceed in-session.
- `api: "ollama"` uses `/api/chat` with `format: <schema>` (constrained decoding);
  `api: "openai"` uses `/v1/chat/completions` with
  `response_format: { type: "json_schema", json_schema: ... }` (LM Studio and
  compatibles). Both are structural constraints, not prompt instructions (AC #2).

### Validation

A minimal schema checker inside the module (type, required, properties, enum, items —
the subset the seam's callers need; document the subset in the module header). No
dependency (chassis rule). Any response failing the caller's schema →
`reason: 'schema-mismatch'` → fallback. `enum` membership and `required` are the
load-bearing checks for the routing use case.

ponytail: full JSON Schema is not implemented — the checked subset is
type/required/properties/enum/items; extend when a consumer's schema needs more.

### Why timeout/refused never block

`AbortSignal.timeout(timeoutMs)` on the fetch; catch everything (abort → `timeout`,
`ECONNREFUSED`/fetch failure → `refused`, non-2xx → `http-error`). Every path lands in
`ok: false`. There is no error path that escapes the function.

### Documentation home (AC #5)

`lib/README.md` gains the module's row; the config surface is documented in the host
CLAUDE.md's model-tiers vicinity via a short subsection in `docs/wiki/chassis.md` plus a
pointer line added where `.claude/model-tiers.json` is described. (The planted PDLC block
itself is bootstrap-owned and not hand-edited; the pointer lands in the repo-owned
orientation text.)

### Tests (AC #7, no live model)

`test/structured-offload.test.mjs` with `node:http` stub servers per case: valid
response validates; prose/invalid JSON → fallback; schema-mismatch (wrong enum, missing
required) → fallback; timeout (server sleeps past timeoutMs) → fallback; refused
(closed port) → fallback; unconfigured (no config file) → fallback; residue recorded on
success and on each fallback; constrained-decoding request body carries the schema for
both `api` values.

## Released surface

`lib/` is released surface: bump marketplace version + plugin versions per
`docs/releasing.md` (`sync-version.mjs` keeps them lockstep). No skill edits → no skill
`version:` bumps. Wiki notes pinned to `lib/` (`chassis`, `test-suite`,
`test-suite-catalog`) go stale — same-PR honest re-pin pass.
