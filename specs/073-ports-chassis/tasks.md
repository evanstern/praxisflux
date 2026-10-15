# Spec 073 — tasks

Each phase is sized for one fresh implementer dispatch. Commit at the end of every phase with
the subject `TASK-0138: <phase summary>`. Run `node --test` before each commit.

## Phase 1 — port registry and configurator

- [x] `lib/port-registry.mjs`: `definePort`, `createRegistry` (`addPort`, `addAdapter`, `ports`, `adapters`, `resolve`), `discover(registry, libDir)`, `PortError` per spec R1
- [x] `resolve` rejects a missing method and a missing floor capability, naming port, adapter and each gap
- [x] `discover` tolerates absent `ports/` and `adapters/` dirs and loads in sorted file order
- [x] Demo fixture: `test/fixtures/ports-demo/lib/ports/demo.mjs`, `adapters/demo/fake.mjs` (in-memory), `adapters/demo/broken.mjs` (missing a method)
- [x] `lib/pdlc-config.mjs`: `CONFIG_FILE`, `loadPdlcConfig`, `configure`, `ConfigError` per spec R2 (config → detected → none; malformed / unknown port / unknown adapter → error)
- [x] `test/port-registry.test.mjs` and `test/pdlc-config.test.mjs` cover every R1/R2 rule and edge case in the spec

**Deviation (Phase 1 dispatch):** `test/check-docs.test.mjs`'s "the praxisflux repo itself is
in sync" test asserts every `lib/*.mjs` file is named in README's chassis section, and this
runs against the real repo as part of the plain `node --test` suite — so adding
`lib/port-registry.mjs` and `lib/pdlc-config.mjs` without a mention breaks that pre-existing
test. Added one minimal clause naming both modules to README's chassis-section sentence now,
ahead of Phase 5's fuller docs/wiki/version pass, so `node --test` stays green without
front-running the rest of Phase 5 (version bump, wiki re-pin, `lib/README.md`/`pdlc/README.md`
updates are untouched and still Phase 5's job).

## Phase 2 — receipts and contract-test harness

- [x] `lib/receipts.mjs`: `receiptPath`, `serializeReceipt`, `writeReceipt`, `readReceipt`, `checkReceipt` per spec R3
- [x] `test/receipts.test.mjs`: byte-determinism (key order independent), trailing newline, absent → ok/`absent`, reformatted file → not ok
- [x] `docs/receipts.md`: the `.<port-dir>/<noun>.json` convention (C2), tracked, helper-only writes, gates read receipts never providers, `.board/links.json` as the tracker's existing receipt, `.forge/changes.json` reserved for TASK-0140
- [x] `lib/contract-harness.mjs`: `runContractSuite({ port, factories, cases })` per spec R4, temp root per test cleaned up
- [x] `test/contract-harness.test.mjs`: the demo suite runs against the fake via the harness and passes; the broken adapter fails validation

**Deviation (Phase 2 dispatch):** `test/contract-harness.test.mjs` cannot drive the harness
through permanent fixture files such as `harness-fake.mjs`/`harness-broken.mjs` under
`test/fixtures/ports-demo/`, because `node --test`'s default discovery runs *every* `.mjs`
file under any `test/` directory tree as its own test file — a fixture whose top-level code
calls `runContractSuite` with the deliberately-broken adapter would register a failing
subtest there too, breaking the plain `node --test` suite's own exit code. Instead the test
generates each driver script into a temp dir **outside** the repo tree at test time
(`mkdtempSync` under the OS tmp dir) and spawns `node` on it there, then removes it — same
behavior proved (fake suite passes, broken adapter fails naming the missing method, temp
root cleanup), no permanent side-effecting file sitting under `test/`. `lib/receipts.mjs` and
`lib/contract-harness.mjs` were also added to README's chassis-section sentence now (minimal
clause, same as Phase 1's deviation), ahead of Phase 5's fuller docs/wiki/version pass.

## Phase 3 — credential helper

- [x] `lib/credentials.mjs`: `resolveToken`, `describeToken` per spec R6 (git credential fill → env vars → null; no prompt; timeout)
- [x] `test/credentials.test.mjs`: stubbed spawn for success, nonzero exit, missing git, empty password → env fallback, env order respected
- [x] One integration test drives real `git credential fill` through a fixture `credential.helper` under a temp `GIT_CONFIG_GLOBAL`/`HOME`, never the operator's keychain
- [x] A test asserts the token never appears in captured stdout/stderr of any chassis call

## Phase 4 — pdlc CLI, doctor, and boundary checks

- [x] `pdlc/scripts/pdlc.mjs` (dual-use, `runAsCli`): `doctor` subcommand, JSON stdout, exit 2 on usage error, exit 1 with `{ "error" }` on config error; injectable `libDir`
- [x] Doctor JSON matches the spec R5 shape, including `config` and `plantReceipt` entries
- [x] `test/pdlc-doctor.test.mjs`: real repo (`ports: []`), demo fixture via config, via detection, unrunnable adapter with reason, malformed `.pdlc.json`
- [x] `test/ports-chassis-boundaries.test.mjs`: the five new modules and `pdlc.mjs` import no `node:http`/`https`/`net`/`tls`, call no `fetch(`, spawn no `gh`/`glab`/`tea`/`backlog`/`rg`/`jq`
- [x] Doctor runs with `PATH` reduced to the dirs holding `git` and `node` (test)

## Phase 5 — docs, wiki, version, gates

- [x] README chassis section names the five new modules and the `pdlc doctor` CLI; `lib/README.md` and `pdlc/README.md` updated; `node scripts/check-docs.mjs` passes
- [x] Marketplace minor bump via `node scripts/sync-version.mjs <next minor>` above `origin/main`; `sync-version --check`, `gen-marketplace --check`, `check-version-bump --base origin/main` pass
- [x] `node pdlc/scripts/plant.mjs --root . --peer backlog --check` passes (re-plant if the bump drifted it)
- [x] Wiki: new `docs/wiki/ports-chassis.md` + INDEX + CAPSULES entries; honest re-pins of every note whose sources changed via `/grounding-wiki:wiki-update`; freshness gate passes
- [x] `node --test`, `node scripts/build.mjs`, `node scripts/run-gates.mjs --gates spec-bridge --path .` all green; no existing test modified except additions

**Deviation (Phase 5 dispatch):** `docs/wiki/pdlc-plugin.md`'s body crossed the 8000-char
note budget by the honest addition of the new `pdlc/scripts/pdlc.mjs` mention (it was
already at 7948/8000 before this task touched it). Marked
`size_budget_exempt: over cap and growing — 8047/8000 at TASK-0138; splitting is separable`
(same pattern as the pre-existing `spec-bridge-plugin.md` exemption) rather than splitting
the note — the freshness gate treats this as a warning, not a failure, and splitting a
component note is a separable job outside this task's scope.
