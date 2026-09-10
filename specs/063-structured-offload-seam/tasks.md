# 063 — tasks

Phases are the dispatch unit: one fresh implementer per phase, re-grounded from this spec
dir plus the branch's commits. Nothing rides chat context between phases. Push after every
phase's commit. Run the suite as bare `node --test`.

## Phase 1 — The module and its tests

- [x] Add `lib/structured-offload.mjs` implementing the plan's contract: config load
      (absent/malformed → `unconfigured`), ollama + openai request shapes with the schema
      passed as a structural constraint, timeout via `AbortSignal.timeout`, all failure
      paths returning `{ ok: false, reason, residue }`, never throwing
- [x] Implement the minimal schema checker (type, required, properties, enum, items) with
      the subset documented in the module header
- [x] Residue on every call (`backend, model, outcome, reason?, ms`), appended to
      `residuePath` when configured
- [x] Add `test/structured-offload.test.mjs` covering: valid response, invalid JSON,
      schema mismatch (wrong enum + missing required), timeout, refused connection,
      unconfigured, residue recording, and the request body carrying the schema for both
      api values — all against `node:http` stubs, no live model
- [x] Full suite green (`node --test`)
- [x] Commit and push

**Deviation (mechanical, forced by the pre-commit gate):** `.githooks/pre-commit` runs
`node --test` under `set -e` and then `check-docs.mjs` directly — both hard-block the
commit, and `check-docs.mjs` requires every `lib/*.mjs` module to be named (in
backticks) somewhere in the repo-root `README.md`'s chassis section, not just
`lib/README.md`. That check failed for `structured-offload` and could not be deferred
to Phase 2 without leaving Phase 1 uncommittable. Added one clause naming
`structured-offload` to README.md's existing chassis module list (matching the format
of every other entry there) — a one-line, format-matching fix distinct from Phase 2's
fuller pass (`lib/README.md`'s own table row, `docs/wiki/chassis.md`'s config-surface
section, the version bump, and the wiki re-pin), which remains Phase 2's job.

A second pre-existing test (`test/board-mirror.test.mjs`, "lib/ contains no MCP calls…",
spec 056 AC #1) hardcoded the exact list of files in `lib/` allowed to contain a literal
`fetch(`. `structured-offload.mjs` is a third, deliberate exception per this spec's
plan (real `fetch()` to a local/user-configured endpoint, opt-in, fail-soft, never MCP) —
updated the test's expected list and comment accordingly rather than silently breaking an
existing invariant check.

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
