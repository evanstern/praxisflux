# Spec 073 — tasks

Each phase is sized for one fresh implementer dispatch. Commit at the end of every phase with
the subject `TASK-0138: <phase summary>`. Run `node --test` before each commit.

## Phase 1 — port registry and configurator

- [ ] `lib/port-registry.mjs`: `definePort`, `createRegistry` (`addPort`, `addAdapter`, `ports`, `adapters`, `resolve`), `discover(registry, libDir)`, `PortError` per spec R1
- [ ] `resolve` rejects a missing method and a missing floor capability, naming port, adapter and each gap
- [ ] `discover` tolerates absent `ports/` and `adapters/` dirs and loads in sorted file order
- [ ] Demo fixture: `test/fixtures/ports-demo/lib/ports/demo.mjs`, `adapters/demo/fake.mjs` (in-memory), `adapters/demo/broken.mjs` (missing a method)
- [ ] `lib/pdlc-config.mjs`: `CONFIG_FILE`, `loadPdlcConfig`, `configure`, `ConfigError` per spec R2 (config → detected → none; malformed / unknown port / unknown adapter → error)
- [ ] `test/port-registry.test.mjs` and `test/pdlc-config.test.mjs` cover every R1/R2 rule and edge case in the spec

## Phase 2 — receipts and contract-test harness

- [ ] `lib/receipts.mjs`: `receiptPath`, `serializeReceipt`, `writeReceipt`, `readReceipt`, `checkReceipt` per spec R3
- [ ] `test/receipts.test.mjs`: byte-determinism (key order independent), trailing newline, absent → ok/`absent`, reformatted file → not ok
- [ ] `docs/receipts.md`: the `.<port-dir>/<noun>.json` convention (C2), tracked, helper-only writes, gates read receipts never providers, `.board/links.json` as the tracker's existing receipt, `.forge/changes.json` reserved for TASK-0140
- [ ] `lib/contract-harness.mjs`: `runContractSuite({ port, factories, cases })` per spec R4, temp root per test cleaned up
- [ ] `test/contract-harness.test.mjs`: the demo suite runs against the fake via the harness and passes; the broken adapter fails validation

## Phase 3 — credential helper

- [ ] `lib/credentials.mjs`: `resolveToken`, `describeToken` per spec R6 (git credential fill → env vars → null; no prompt; timeout)
- [ ] `test/credentials.test.mjs`: stubbed spawn for success, nonzero exit, missing git, empty password → env fallback, env order respected
- [ ] One integration test drives real `git credential fill` through a fixture `credential.helper` under a temp `GIT_CONFIG_GLOBAL`/`HOME`, never the operator's keychain
- [ ] A test asserts the token never appears in captured stdout/stderr of any chassis call

## Phase 4 — pdlc CLI, doctor, and boundary checks

- [ ] `pdlc/scripts/pdlc.mjs` (dual-use, `runAsCli`): `doctor` subcommand, JSON stdout, exit 2 on usage error, exit 1 with `{ "error" }` on config error; injectable `libDir`
- [ ] Doctor JSON matches the spec R5 shape, including `config` and `plantReceipt` entries
- [ ] `test/pdlc-doctor.test.mjs`: real repo (`ports: []`), demo fixture via config, via detection, unrunnable adapter with reason, malformed `.pdlc.json`
- [ ] `test/ports-chassis-boundaries.test.mjs`: the five new modules and `pdlc.mjs` import no `node:http`/`https`/`net`/`tls`, call no `fetch(`, spawn no `gh`/`glab`/`tea`/`backlog`/`rg`/`jq`
- [ ] Doctor runs with `PATH` reduced to the dirs holding `git` and `node` (test)

## Phase 5 — docs, wiki, version, gates

- [ ] README chassis section names the five new modules and the `pdlc doctor` CLI; `lib/README.md` and `pdlc/README.md` updated; `node scripts/check-docs.mjs` passes
- [ ] Marketplace minor bump via `node scripts/sync-version.mjs <next minor>` above `origin/main`; `sync-version --check`, `gen-marketplace --check`, `check-version-bump --base origin/main` pass
- [ ] `node pdlc/scripts/plant.mjs --root . --peer backlog --check` passes (re-plant if the bump drifted it)
- [ ] Wiki: new `docs/wiki/ports-chassis.md` + INDEX + CAPSULES entries; honest re-pins of every note whose sources changed via `/grounding-wiki:wiki-update`; freshness gate passes
- [ ] `node --test`, `node scripts/build.mjs`, `node scripts/run-gates.mjs --gates spec-bridge --path .` all green; no existing test modified except additions
