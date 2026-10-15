# 073 — Ports chassis

**Task:** TASK-0138 · **Epic:** TASK-0143 · **Design of record:** decision-0002 (Accepted
2026-10-12), `vault/Ports-and-Adapters-for-PDLC/Analysis-Rebuild-Architecture.md` ·
**Runbook:** `docs/design/ports-rebuild-runbook.md`

## Problem

decision-0002 rebuilds pdlc as one hexagon with four driven ports (Tracker, Forge, Spec,
Harness) and one driving port (a `pdlc` CLI). Every port needs the same machinery: a way to
declare a port contract, register adapters, choose one per host, write receipts that gates
read, prove every adapter against one contract suite, report what can run here, and resolve a
forge credential without assuming `gh`. Today only the board seam has a fragment of this
(`lib/board-mirror.mjs`'s `providers` object and its byte-deterministic mirror writer), and it
is shaped for one port.

This task builds that shared machinery **once**, so TASK-0139..0142 each add only a port
contract plus adapters. **No existing port moves onto the chassis here, and no incumbent
behavior changes.** The board seam, `plant.mjs`, the bridge gate and every skill behave
byte-identically after this lands.

## Operator rulings (binding, 2026-10-15)

- **C1 — configurator file: a new `.pdlc.json`** at the project root, operator-authored:
  `{ "ports": { "<port>": "<adapter>" } }`. An absent file, or an absent key for a port, means
  **detection** for that port. `.pdlc` stays the machine-written plant receipt
  (`pdlc/scripts/plant.mjs`); `.board.json` stays the tracker adapter's own settings. This task
  reads neither of those two files' content as configuration.
- **C2 — receipt location: `.<port-dir>/<noun>.json`**, tracked (not gitignored), written only
  through the chassis receipt helper, byte-deterministic. The tracker keeps
  `.board/links.json` unchanged; the forge port (TASK-0140) will use `.forge/changes.json`; the
  spec and harness ports have no receipt (the spec dir and the `Dispatch:` lines are their
  evidence).

## Binding constraints (decision-0002)

- Node built-ins only; no new runtime dependency (no `package.json` dependency is added).
- New code never requires `gh`, `glab`, `tea`, `backlog`, `rg` or `jq`. Only `git`, `node` and a
  POSIX shell are assumed.
- `gates/` and the chassis core make no network or MCP calls. Gates read receipts, never
  providers.
- Adapters are code. Skills are not edited by this task.
- `pdlc/scripts/plant.mjs` is **not edited** (TASK-0134 owns it in this sweep).

## User Scenarios

### US1 — A port author declares a port and registers adapters (P1)

A later task (e.g. TASK-0140) writes `lib/ports/forge.mjs` declaring the port's required
methods and floor capabilities, and `lib/adapters/forge/github.mjs`. The registry discovers the
adapter, and rejects it at resolve time if it misses a method or a floor.

**Acceptance:** an adapter missing a required method, or not declaring a floor capability,
fails `resolve` with an error naming the port, the adapter and what is missing.

### US2 — An operator pins or omits an adapter choice (P1)

With `.pdlc.json` `{"ports":{"demo":"fake"}}`, the configurator returns `fake` for `demo`. With
no file, or no `demo` key, it runs each registered adapter's `detect(root)` in registration order
and returns the first match, recording `source: "detected"`.

### US3 — A gate checks a receipt offline (P1)

A verb writes `.demo/things.json` through the helper. A gate re-reads it and confirms the bytes
are canonical, with no provider call. A hand-edited, reformatted receipt fails that check.

### US4 — Every adapter of a port runs one contract suite (P1)

A port's test file calls the harness once with a list of adapter factories. The same assertions
run against each, the in-memory fake included.

### US5 — An operator asks "what can run here?" (P2)

`node pdlc/scripts/pdlc.mjs doctor` prints JSON: each registered port, its configured adapter,
how it was chosen, and whether that adapter can run on this host, with a reason when it cannot.

### US6 — A forge adapter needs a token (P2)

The credential helper asks `git credential fill` for the remote's host, then falls back to named
env vars. It returns the token to the caller and reports only its *source* anywhere visible.

### Edge cases

- `.pdlc.json` is malformed JSON, or `ports` is not an object, or names an unknown port → a
  configuration error naming the file and the problem; never a silent fallback to detection.
- `.pdlc.json` names an adapter that is not registered for that port → configuration error.
- No adapter's `detect` matches and no config → `{ adapter: null, source: "none" }`; doctor
  reports it, it is not a crash.
- `lib/ports/` or `lib/adapters/<port>/` absent → discovery returns an empty registry.
- `git` missing from `PATH`, or `git credential fill` exits nonzero / prompts → the helper never
  blocks on a prompt (`GIT_TERMINAL_PROMPT=0`, stdin closed) and falls through to env vars.
- A receipt with keys in a different order, or without the trailing newline → `checkReceipt`
  reports it non-canonical.

## Requirements (mapped 1:1 to TASK-0138 acceptance criteria)

- **R1 (AC #1) — Port registry.** `lib/port-registry.mjs` exports:
  - `definePort({ name, methods, floors = [], receiptDir = null })` → frozen port definition.
    `methods`: required method names. `floors`: capability strings every adapter must declare.
    `receiptDir`: the dot-dir its receipts live in (e.g. `".forge"`), or `null`.
  - `createRegistry()` → `{ addPort(port), addAdapter(portName, adapter), ports(), adapters(portName), resolve(portName, adapterName) }`.
  - Adapter shape: `{ name, capabilities: string[], detect(root) → boolean, probe(root, env) → { ok: boolean, reason?: string }, ...methods }`. `probe` is offline: it may check `PATH`
    entries via `fs`, env var presence and files; it never spawns network clients.
  - `resolve` throws `PortError` naming port, adapter, and each missing method or floor.
    `addAdapter` to an undeclared port throws.
  - `discover(registry, libDir)` imports every `<libDir>/ports/*.mjs` (each default-exports a
    port definition) and every `<libDir>/adapters/<port>/*.mjs` (each default-exports a factory
    `() => adapter`). Missing dirs are not errors.
- **R2 (AC #2) — Configurator.** `lib/pdlc-config.mjs` exports `CONFIG_FILE = ".pdlc.json"`,
  `loadPdlcConfig(root)` → `{ ports: {} }` when absent, throws `ConfigError` when malformed, and
  `configure(registry, root)` → `{ [port]: { adapter: string|null, source: "config"|"detected"|"none" } }`.
  Config choices are resolved through `registry.resolve` so floors are enforced at configure
  time. The C1 ruling is recorded in TASK-0138's notes.
- **R3 (AC #3) — Receipts.** `lib/receipts.mjs` exports `receiptPath(root, receiptDir, noun)`,
  `serializeReceipt(value)` (keys sorted recursively, arrays kept in caller order,
  `JSON.stringify(…, null, 2) + "\n"`), `writeReceipt(root, receiptDir, noun, value)`,
  `readReceipt(root, receiptDir, noun)` (null when absent), and
  `checkReceipt(root, receiptDir, noun)` → `{ ok, reason? }` (absent → ok with reason `absent`;
  non-canonical bytes → not ok). The convention (C2) is documented in `docs/receipts.md`,
  including the existing `.board/links.json` as the tracker's receipt, which keeps its own
  explicit-key-order serializer and is not migrated by this task.
- **R4 (AC #4) — Contract-test harness.** `lib/contract-harness.mjs` exports
  `runContractSuite({ port, factories, cases })` where `factories` is `{ [adapterName]: () => adapter }` and `cases` is `[{ name, run(adapter, ctx) }]`. It registers one `node:test`
  `describe` per adapter and one `test` per case; `ctx` carries a fresh temp root per test that
  the harness removes afterwards. Every factory is also validated against the port with
  `registry.resolve`. A demo port and in-memory fake in `test/fixtures/ports-demo/` prove it
  (fixture only — not shipped in `lib/`).
- **R5 (AC #5) — `pdlc` CLI and doctor.** `pdlc/scripts/pdlc.mjs` (dual-use via `runAsCli`)
  is the driving port's entry. Subcommands this task ships: `doctor`. Output is JSON on stdout;
  usage errors exit 2, configuration errors exit 1 with `{ "error": … }`. `doctor` shape:

  ```json
  { "schema": 1,
    "root": "<abs path>",
    "config": { "file": ".pdlc.json", "present": false },
    "plantReceipt": { "file": ".pdlc", "present": true },
    "ports": [ { "port": "<name>", "adapter": "<name>|null", "source": "config|detected|none",
                 "canRun": true, "reason": null } ] }
  ```

  With no ports registered (the state after this task), `ports` is `[]`. Doctor takes an
  injectable `libDir` so tests run it against the demo fixture. The JSON names `.pdlc` as the
  plant receipt so the two look-alike files are distinguished (C1 mitigation).
- **R6 (AC #6) — Credential helper.** `lib/credentials.mjs` exports
  `resolveToken({ host, protocol = "https", envVars = [], spawn = spawnSync, env = process.env })`
  → `{ token, source: "git-credential" | "env:<NAME>" } | null`. It runs
  `git credential fill` with input `protocol=<p>\nhost=<h>\n\n`, env `GIT_TERMINAL_PROMPT=0`,
  stdin closed after input, a timeout, and parses `password=`. It never writes the token to
  stdout, stderr or any file; `describeToken(result)` returns only the source for display.
- **R7 (AC #7) — No new dependencies or tools.** No `dependencies` added anywhere. A test scans
  the new modules and fails on any `node:http`, `node:https`, `node:net`, `node:tls`, `fetch(`
  use, and on any spawn of `gh`, `glab`, `tea`, `backlog`, `rg` or `jq`. The only spawned binary
  is `git`.
- **R8 (AC #8) — Tests.** `node --test` covers registry, configurator, receipts, harness,
  doctor and credential helper; the full suite is green.
- **R9 (AC #9) — Docs, versions, gates.** README chassis section names every new `lib/*.mjs`
  (`check-docs.mjs` enforces it) and the `pdlc` CLI; the wiki gains a chassis-ports note and
  re-pins every note whose sources changed; marketplace version takes a minor bump via
  `node scripts/sync-version.mjs`; every gate in the runbook's per-PR list is green.

## Out of scope

- Any concrete port (`lib/ports/*.mjs`) or adapter (`lib/adapters/**`) — TASK-0139..0142.
- Moving `lib/board-mirror.mjs` `providers` onto the registry — TASK-0141.
- Forge receipt timing (a merge receipt cannot sit in the merge commit it records) — TASK-0140.
- A `pdlc` bin shim on `PATH`; skills calling the CLI (TASK-0139).
- Editing `pdlc/scripts/plant.mjs`, any SKILL.md, `.pdlc`, or `.board.json`.

## Success criteria

- Every requirement above has a passing test; `node --test` green.
- A diff of behavior for existing commands is empty: no existing test changes except
  additions, no existing file under `pdlc/skills/`, `spec-bridge/`, or `lib/board-mirror.mjs`
  changes.
- `doctor` runs with only `git` and `node` on `PATH`.
