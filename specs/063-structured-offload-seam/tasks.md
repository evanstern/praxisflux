# 063 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases. Push after every
phase's commit. Run the suite as bare `node --test`.

## Phase 1 — The module and its tests

- [ ] Add `lib/structured-offload.mjs` implementing the plan's contract: config load
      (absent/malformed → `unconfigured`), ollama + openai request shapes with the schema
      passed as a structural constraint, timeout via `AbortSignal.timeout`, all failure
      paths returning `{ ok: false, reason, residue }`, never throwing
- [ ] Implement the minimal schema checker (type, required, properties, enum, items) with
      the subset documented in the module header
- [ ] Residue on every call (`backend, model, outcome, reason?, ms`), appended to
      `residuePath` when configured
- [ ] Add `test/structured-offload.test.mjs` covering: valid response, invalid JSON,
      schema mismatch (wrong enum + missing required), timeout, refused connection,
      unconfigured, residue recording, and the request body carrying the schema for both
      api values — all against `node:http` stubs, no live model
- [ ] Full suite green (`node --test`)
- [ ] Commit and push

## Phase 2 — Documentation, versions, wiki

- [ ] Add the module row to `lib/README.md`
- [ ] Document the config surface (`.claude/structured-offload.json`, fields, fail-soft
      semantics, opt-in default) in `docs/wiki/chassis.md` with a pointer where the
      model-tier ladder is described
- [ ] Bump versions per `docs/releasing.md` (marketplace + plugin versions lockstep via
      `sync-version.mjs`)
- [ ] Honest re-pin pass over wiki notes whose sources this branch touched (`chassis`,
      `test-suite`, `test-suite-catalog`): classify per diff, amend prose where needed,
      re-pin
- [ ] `node scripts/check-docs.mjs`, `gen-marketplace --check`, `sync-version --check`,
      freshness gate all green
- [ ] Commit and push
