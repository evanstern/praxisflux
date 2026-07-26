# grounding-wiki

Build and maintain a **code-grounded corpus** for a codebase: `docs/wiki/` of per-concept
Markdown notes, each pinned to the commit it was verified against (`verified_against:`) and
to the source paths whose change invalidates it (`sources:`). Format:
[`docs/corpus-spec.md`](../docs/corpus-spec.md) (repo-level, shared by all praxisflux plugins).

- **`wiki-build`** — generate the corpus from a codebase (survey → notes → index → gate).
- **`wiki-update`** — the in-place refresh loop: find stale notes via the gate, re-verify
  each against the actual diff, re-pin.
- **`gates/freshness.mjs`** (+ `gates/cli.mjs freshness <repo-root> [corpus-dir]`) — the
  read-only staleness check: exit 1 listing every note whose sources changed after its pin.
  Also enforces the corpus-spec v2 token budgets (`description:` capsule ≤500 chars, note
  body ≤8,000 chars, `CAPSULES.md` currency via regenerate-and-compare) — hard failures
  once a corpus has a `CAPSULES.md`, warn-only notices before it adopts one.
  Drop-in usable as a pre-commit hook or CI pre-merge gate.
- **`scripts/capsules.mjs <repo-root> [corpus-dir]`** — (re)generate `CAPSULES.md`, the
  corpus's capsule rollup (each note's INDEX line + its `description:`, in INDEX order,
  headered with the generator and corpus commit). Derived state: both skills regenerate it
  whenever any description changes; hand-editing it fails the gate.

Reference deployment: a local reference repo's `docs/wiki/` (22 notes + a repo-local bash port
of the gate). Downstream consumers: analyze-vault (Q&A), codebase-to-course (brief grounding),
educate (lesson grounding), external ingestion (MCP-served Q&A).
