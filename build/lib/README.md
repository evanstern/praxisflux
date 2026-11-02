# lib — the shared Node chassis

Zero-dependency Node modules shared by every plugin, **vendored into each plugin at build time**
(a shipped `.plugin` is self-contained; `${CLAUDE_PLUGIN_ROOT}/lib/…` resolves at runtime).

Planned modules (**TASK-1.2**): `project-root` · `gate-runner` (Stop-hook harness) · `markdown`
· `selfcontained` (HTML verifier) · `lifecycle` (status-cannot-exceed-proven-artifacts) ·
`installer` · `dates` · `template`.

Also shipped: `structured-offload` — schema-validated, fail-soft calls to a local
Ollama/OpenAI-compatible endpoint, config-driven (`.claude/structured-offload.json`),
opt-in and absent-by-default. See `docs/wiki/chassis.md`.

Also shipped here: `handoff-protocol.md` — a stamped copy of the canonical
`docs/handoff-protocol.md` (re-stamped by `scripts/sync-shared.mjs`), so skills can reference
the protocol as `${CLAUDE_PLUGIN_ROOT}/lib/handoff-protocol.md` from an installed plugin.

**pdlc ports chassis** (decision-0002): `port-registry` (`definePort`/`createRegistry`/
`discover` — port+adapter declaration, registration and `resolve`) · `pdlc-config`
(`.pdlc.json` adapter configurator: config → detected → none) · `receipts`
(byte-deterministic `.<port-dir>/<noun>.json` read/write/check; convention documented in
`docs/receipts.md`) · `contract-harness` (`runContractSuite` — one assertion suite run
against every adapter of a port) · `credentials` (`resolveToken`/`describeToken` — a forge
token via `git credential fill`, falling back to env vars, never a prompt). See
`docs/wiki/ports-chassis.md`.
