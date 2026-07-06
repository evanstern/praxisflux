# lib — the shared Node chassis

Zero-dependency Node modules shared by every plugin, **vendored into each plugin at build time**
(a shipped `.plugin` is self-contained; `${CLAUDE_PLUGIN_ROOT}/lib/…` resolves at runtime).

Planned modules (**TASK-1.2**): `project-root` · `gate-runner` (Stop-hook harness) · `markdown`
· `selfcontained` (HTML verifier) · `lifecycle` (status-cannot-exceed-proven-artifacts) ·
`installer` · `dates` · `template`.
