# lib — the shared Node chassis

Zero-dependency Node modules shared by every plugin, **vendored into each plugin at build time**
(a shipped `.plugin` is self-contained; `${CLAUDE_PLUGIN_ROOT}/lib/…` resolves at runtime).

Planned modules (**TASK-1.2**): `project-root` · `gate-runner` (Stop-hook harness) · `markdown`
· `selfcontained` (HTML verifier) · `lifecycle` (status-cannot-exceed-proven-artifacts) ·
`installer` · `dates` · `template`.

Also shipped here: `handoff-protocol.md` — a stamped copy of the canonical
`docs/handoff-protocol.md` (re-stamped by `scripts/sync-shared.mjs`), so skills can reference
the protocol as `${CLAUDE_PLUGIN_ROOT}/lib/handoff-protocol.md` from an installed plugin.
