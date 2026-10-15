# PR Explainer — file-map

**What this page answers:** Show every changed file, bucketed by concern, generated fresh from the real diff — never hand-maintained.

**Facts it needs:** every claim on this page must trace to an id in
`facts.json` (or, for a generated page, to the generator's own output) —
never state something the fact-gatherer didn't record.

**Patterns that fit:** `file-map`.
**Diagrams that fit:** none suggested.

**House style:** see `references/house-style.md` for the full text of
`no-internal-codes`, `github-file-links`, `info-for-detail-in-tight-space`.

**What to avoid:** Never hand-maintain the file list — it must come from the manifest generator, or it will drift from the real diff. Never add the explainer's own `docs/explainers/<name>/` folder to `generators.manifest.buckets[]` — the `git-manifest` built-in excludes it automatically, even when it lands inside the diff range (e.g. right after `/explain` commits its own source). Use `generators.manifest.exclude` for any other self-generated path that shouldn't appear in the manifest.
