# grounding-wiki

Build and maintain a **code-grounded corpus** for a codebase: `docs/wiki/` of per-concept
Markdown notes, each pinned to the commit it was verified against (`verified_against:`) and
to the source paths whose change invalidates it (`sources:`). Format:
[`docs/corpus-spec.md`](../docs/corpus-spec.md) (repo-level, shared by all praxis plugins).

- **`wiki-build`** — generate the corpus from a codebase (survey → notes → index → gate).
- **`wiki-update`** — the in-place refresh loop: find stale notes via the gate, re-verify
  each against the actual diff, re-pin.
- **`gates/freshness.mjs`** (+ `gates/cli.mjs freshness <repo-root> [corpus-dir]`) — the
  read-only staleness check: exit 1 listing every note whose sources changed after its pin.
  Drop-in usable as a pre-commit hook or CI pre-merge gate.

Reference deployment: the akashic repo's `docs/wiki/` (22 notes + a repo-local bash port of
the gate). Downstream consumers: analyze-vault (Q&A), codebase-to-course (brief grounding),
educate (lesson grounding), akashic ingestion (MCP-served Q&A).
