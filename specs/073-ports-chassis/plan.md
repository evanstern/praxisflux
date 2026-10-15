# 073 — implementation plan

**Spec:** `specs/073-ports-chassis/spec.md` · **Task:** TASK-0138

## Summary

Add five zero-dependency chassis modules to `lib/` (registry, configurator, receipts,
contract harness, credentials) and the driving-port entry `pdlc/scripts/pdlc.mjs` with a
`doctor` subcommand. Prove them with `node --test` against a demo port fixture. Ship no concrete
port or adapter. Change no existing behavior.

## Technical context

- **Language/runtime:** Node ESM (`.mjs`), Node built-ins only (`node:fs`, `node:path`,
  `node:url`, `node:child_process`, `node:os`, `node:test`, `node:assert`).
- **Testing:** `node --test`; new files under `test/`, fixtures under `test/fixtures/`. Use
  `test/fixture-teardown.mjs` for temp-dir cleanup (spec 070).
- **Distribution:** `lib/` reaches each plugin through its `lib -> ../lib` symlink;
  `scripts/build.mjs` dereferences it into `dist/<plugin>/lib/`. `pdlc/scripts/pdlc.mjs`
  imports `../lib/…`, so it works in-repo, packaged and marketplace-installed with no build
  change. `lib/ports/` and `lib/adapters/` are created empty-by-absence: discovery tolerates
  missing dirs, so no placeholder files are committed.
- **Constraints:** see spec "Binding constraints". `pdlc/scripts/plant.mjs` is not touched.

## Constitution check (`.specify/memory/constitution.md`)

- **I. Artifact-grounded action** — pass. Every chassis write lands a tracked receipt;
  doctor's report is JSON a caller can persist; rulings C1/C2 live in the runbook and on the
  card.
- **II. One TASK, one PR** — pass. One branch `task-0138-ports-chassis`, one PR; phases are
  commits.
- **III. Artifact-gated seams** — pass. Receipts are the seam; gates read them via
  `checkReceipt`, never providers.
- **IV. Status never exceeds proven artifacts** — pass. tasks.md phases drive the card via
  spec-bridge; no hand-set Done.
- **V. Composition through files and gates only** — pass. The CLI and receipts are files and
  processes; no plugin calls another's code beyond the shared `lib/` chassis, which is the
  sanctioned shared layer.
- **VI. Advisory local, authoritative CI** — pass. No new hook; tests run in CI via the
  spec-bridge `tests` gate.
- **VII. Grounding freshness is part of done** — pass with obligation: Phase 5 re-pins notes
  and adds the new note.
- **VIII. Amendment procedure** — not triggered.

## Project structure

```
lib/
  port-registry.mjs      R1  definePort, createRegistry, discover, PortError
  pdlc-config.mjs        R2  CONFIG_FILE, loadPdlcConfig, configure, ConfigError
  receipts.mjs           R3  receiptPath, serializeReceipt, write/read/checkReceipt
  contract-harness.mjs   R4  runContractSuite
  credentials.mjs        R6  resolveToken, describeToken
pdlc/scripts/pdlc.mjs    R5  CLI entry: doctor
docs/receipts.md         R3  the receipt convention (C2), incl. .board/links.json
test/
  port-registry.test.mjs
  pdlc-config.test.mjs
  receipts.test.mjs
  contract-harness.test.mjs   runs the demo suite through the harness
  credentials.test.mjs        stubbed spawn + a real-git case with a credential helper fixture
  pdlc-doctor.test.mjs
  ports-chassis-boundaries.test.mjs   R7 no-network / no-forbidden-tool scan
  fixtures/ports-demo/lib/ports/demo.mjs
  fixtures/ports-demo/lib/adapters/demo/fake.mjs
  fixtures/ports-demo/lib/adapters/demo/broken.mjs   (missing a method — negative case)
```

## Design notes

- **Registry is an explicit object, not a global.** `createRegistry()` returns fresh state so
  tests never leak; the CLI builds one per run via `discover(registry, libDir)`.
- **Detection order** is registration order, which `discover` makes deterministic by sorting
  file names.
- **Floors** are plain capability strings. `resolve` checks
  `port.floors ⊆ adapter.capabilities`. TASK-0140 declares `merge-commit` and
  `sha-guarded-merge` as forge floors; this task only proves the mechanism.
- **Receipt serialization** sorts object keys recursively. The tracker's `.board/links.json`
  keeps its own explicit key order and is documented, not migrated (TASK-0141 decides).
- **Doctor's `canRun`** is `adapter.probe(root, process.env).ok`; adapter is `null` → `canRun:
  false, reason: "no adapter configured or detected"`.
- **Credentials:** spawn `git` with `["credential", "fill"]`, `input` set, `timeout: 10000`,
  `env: { ...env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" }`. Parse `password=`.
  Any failure → env fallback. Tests inject `spawn`; one integration test uses a temp
  `GIT_CONFIG_GLOBAL` pointing at a fixture `credential.helper` shell script, so it never
  touches the operator's real keychain.
- **No-network test scope:** it scans the five new `lib/*.mjs` modules and
  `pdlc/scripts/pdlc.mjs`. It deliberately does not scan pre-existing modules
  (`lib/structured-offload.mjs` already uses `fetch`; see Open questions).

## Docs, wiki, versions

- `README.md` chassis section names `port-registry`, `pdlc-config`, `receipts`,
  `contract-harness`, `credentials` (else `check-docs.mjs` fails) and the `pdlc doctor` CLI.
- `lib/README.md`: one line per new module. `pdlc/README.md`: a short "pdlc CLI" section.
- Wiki: new note `docs/wiki/ports-chassis.md` (sources: the five modules,
  `pdlc/scripts/pdlc.mjs`, `docs/receipts.md`), INDEX + CAPSULES entries; re-pin
  `chassis.md`, `overview.md`, `pdlc-plugin.md`, `test-suite-catalog*.md` honestly via
  `/grounding-wiki:wiki-update`.
- Version: minor bump (`node scripts/sync-version.mjs <next minor>` above `origin/main` at PR
  time). No SKILL.md edited → no skill version bump. `sync-version` also stamps the planted
  block (since ef405b1); confirm `plant.mjs --root . --peer backlog --check` passes.

## Open questions (flagged to the orchestrator)

- **No-network boundary vs `lib/adapters/`.** decision-0002 places adapters under
  `lib/adapters/<port>/` and also says `lib/` makes no network calls; the github REST adapter
  (TASK-0140) must call `fetch`. This plan assumes the invariant binds `gates/` and the chassis
  core, and that network transport lives only in `lib/adapters/**`. That ruling is TASK-0140's to
  confirm; this task's scan covers only its own new files, so it forecloses nothing.
- `lib/structured-offload.mjs` already calls `fetch` from `lib/` (spec 063). Pre-existing; not
  changed here.
