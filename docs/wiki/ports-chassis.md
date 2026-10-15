---
name: ports-chassis
description: The pdlc ports chassis (decision-0002, spec 073, TASK-0138) — the shared machinery every driven port (Tracker, Forge, Spec, Harness) builds on: port/adapter declaration and resolve, the .pdlc.json adapter configurator, byte-deterministic receipts, a one-suite contract-test harness, a gh-free credential helper, and the pdlc doctor CLI. No port is registered yet.
kind: component
sources:
  - lib/port-registry.mjs
  - lib/pdlc-config.mjs
  - lib/receipts.mjs
  - lib/contract-harness.mjs
  - lib/credentials.mjs
  - pdlc/scripts/pdlc.mjs
  - docs/receipts.md
verified_against: e9cf2187254c768efd84ad367f3d3c97a045b086
---

# The pdlc ports chassis

decision-0002 (Accepted 2026-10-12) rebuilds `pdlc` as one hexagon with four **driven**
ports — Tracker, Forge, Spec, Harness — and one **driving** port, the `pdlc` CLI. Every port
needs the same five pieces: declare a contract, register adapters, pick one per host, write
receipts a gate can read offline, and prove every adapter against one suite. TASK-0138 builds
that machinery once, in [[chassis]], so TASK-0139..0142 each add only a port contract plus
adapters. **No existing port moves onto the chassis here** (the board seam in
[[board-provider-seam]] is unchanged byte-for-byte), and **no port is registered yet** — the
registry, discovered against this repo's `lib/`, is empty.

## Port registry (`lib/port-registry.mjs`)

`definePort({ name, methods, floors = [], receiptDir = null })` returns a frozen port
definition: `methods` are required method names, `floors` are capability strings every
adapter must declare in its `capabilities` array, `receiptDir` is the dot-dir its receipts
live in (or `null`). `createRegistry()` returns fresh, non-global state — `{ addPort,
addAdapter, ports, adapters, resolve }` — so tests and the CLI each get their own.
`addAdapter` to a port that was never declared throws. `resolve(portName, adapterName)` is
the only place the contract is actually enforced: a registered-but-broken adapter sits
quietly in the registry until something resolves it, at which point `PortError` names the
port, the adapter, and every missing method or floor.

`discover(registry, libDir)` is the module's only I/O: it imports every
`<libDir>/ports/*.mjs` (default-exporting a port definition) and, per registered port,
every `<libDir>/adapters/<port>/*.mjs` (default-exporting a factory `() => adapter`), in
sorted file order — the order detection then walks. Missing `ports/`/`adapters/` dirs are
not errors; a chassis with no ports yet (this repo, today) discovers an empty registry.

## Configurator (`lib/pdlc-config.mjs`)

`CONFIG_FILE = ".pdlc.json"` — a new, operator-authored file (**C1**, ruled 2026-10-15):
`{ "ports": { "<port>": "<adapter>" } }`. Deliberately distinct from two look-alikes:
`.pdlc` is the machine-written plant receipt (`pdlc/scripts/plant.mjs`, unedited by this
task); `.board.json` is the tracker adapter's own settings (`spec-bridge`'s
`validateBoardConfig`). Neither is read as chassis configuration.

`loadPdlcConfig(root)` returns `{ ports: {} }` when the file is absent and throws
`ConfigError` on malformed JSON or a non-object `ports`. `configure(registry, root)` returns
`{ [port]: { adapter, source } }` per registered port: a `.pdlc.json` entry wins
(`source: "config"`, resolved through `registry.resolve` so floors are enforced at
configure time, not deferred to first use — an unregistered port or adapter name is a
`ConfigError`); absent a config entry, each adapter's `detect(root)` runs in registration
order and the first match wins (`source: "detected"`); no match and no config is
`{ adapter: null, source: "none" }` — never a crash.

## Receipts (`lib/receipts.mjs`, `docs/receipts.md`)

**C2** (ruled 2026-10-15): a receipt lives at `.<port-dir>/<noun>.json`, tracked (not
gitignored, unlike the [[handoff-protocol]] transport), written only through
`writeReceipt` — never hand-edited. `serializeReceipt` sorts object keys recursively
(arrays keep caller order), always `JSON.stringify(value, null, 2) + "\n"` — the
byte-determinism `lib/board-mirror.mjs`'s `writeMirror` already proved for
`.board/links.json`, now generalized. `checkReceipt` re-serializes the on-disk value and
byte-compares, so a hand-edited or reformatted file fails even though its JSON still
parses; absent → `{ ok: true, reason: "absent" }`.

**Gates read receipts, never providers** — the seam this chassis generalizes.
`.board/links.json` keeps its own pre-existing explicit-key-order serializer, documented
not migrated (TASK-0141 decides). `.forge/changes.json` is reserved for the forge port
(TASK-0140). The spec and harness ports have no receipt: the spec dir and the `Dispatch:`
record ([[pdlc-grounding-block]]) are their evidence instead.

## Contract-test harness (`lib/contract-harness.mjs`)

`runContractSuite({ port, factories, cases })` — `factories` is `{ [adapterName]: () =>
adapter }`, `cases` is `[{ name, run(adapter, ctx) }]` — registers one `node:test`
`describe` per adapter and, inside it, a contract-validation test (`registry.resolve`) plus
one `test` per case, each against a fresh adapter instance and a fresh temp root the
harness removes afterward. A port author writes `cases` once; every adapter — including an
in-memory fake — proves the same behavior (US4). A demo port and `fake`/`broken` adapters
prove the mechanism under `test/fixtures/ports-demo/` (fixture only, not shipped in
`lib/`); the driving test generates its driver script into a temp dir outside the repo tree
at test time, since `node --test`'s default discovery would otherwise run the
deliberately-broken fixture as its own failing test.

## Credential helper (`lib/credentials.mjs`)

`resolveToken({ host, protocol = "https", envVars = [], spawn, env })` asks
`git credential fill` first (whatever helper the host has configured), then the first
present env var in `envVars` order, and never a third fallback: `GIT_TERMINAL_PROMPT=0` plus
a closed-after-input stdin and a 10s timeout mean a misconfigured or interactive helper
cannot hang the caller. It returns `{ token, source: "git-credential" | "env:<NAME>" }` or
`null`; `describeToken(result)` returns only `source` — the token itself never appears in
any log, return value, or file but the `token` field. `spawn`/`env` are injectable, so tests
stub the spawn for the failure matrix and one integration test points a fixture
`credential.helper` at a temp `GIT_CONFIG_GLOBAL`/`HOME`, never the operator's real keychain.

## The driving port: `pdlc/scripts/pdlc.mjs`

A dual-use CLI (`lib/cli.mjs`'s `runAsCli`), separate from `pdlc/scripts/plant.mjs`. This
task ships one subcommand:

```
node pdlc/scripts/pdlc.mjs doctor [--root <dir>] [--lib-dir <dir>]
```

`doctor({ root, libDir })` discovers the registry against `libDir` (defaults to
`<root>/lib`; tests point it at `test/fixtures/ports-demo/lib`), resolves the configuration,
and for every registered port reports its adapter, how it was chosen
(`config`/`detected`/`none`), and `canRun` — `adapter.probe(root, process.env).ok`, with a
`reason` when `false` or when no adapter resolved at all. Output is JSON on stdout; usage
errors exit 2, a `ConfigError`/`PortError` from `configure` exits 1 as `{ "error": … }`
instead of a stack trace. The JSON also names `.pdlc.json` (config, absent by default) and
`.pdlc` (the plant receipt) explicitly side by side, so a reader never conflates pdlc's two
similarly-named files (C1's stated mitigation). Against this repo today, `doctor` reports
`ports: []` — nothing is registered until TASK-0139..0142 add the tracker/forge/spec/harness
ports and their adapters.

## No-network, no-forbidden-tool boundary

Every module above, plus `pdlc.mjs`, is scanned by a dedicated test for `node:http`,
`node:https`, `node:net`, `node:tls`, and `fetch(`, and for a spawned `gh`, `glab`, `tea`,
`backlog`, `rg`, or `jq` — the only binary any of them spawns is `git` (the credential
helper). The scan is scoped to these new files; it does not re-litigate `lib/`'s one
pre-existing exception, `lib/structured-offload.mjs`'s `fetch` call (spec 063), and it
forecloses nothing about where a future network-calling adapter (e.g. TASK-0140's GitHub
REST forge adapter) may live under `lib/adapters/**`.

## Connections

[[chassis]] is the module roster this chassis joins. [[board-provider-seam]] is the one
existing seam this task deliberately does not migrate onto it. [[pdlc-plugin]] is the
plugin `pdlc.mjs` ships under. Behavior is covered by [[test-suite]] /
[[test-suite-catalog-plugins-gates-pdlc]].
