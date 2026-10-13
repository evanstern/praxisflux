# file-map

Bucket chips, a status filter, a search box, and "show all" over a changed-file
manifest (from the reference site's `files.html`).
Fed by the `git-manifest` built-in generator's real output
(`scripts/lib/generators.mjs` `runGitManifest`: `{files:[{path,status,bucket}],
counts}`), via `<x-include ... as="data"/>` — never pasted into the page by
hand (follow-up: this is exactly the drift
exists to stop).

**Generator contract:** `git-manifest` always auto-excludes the artifact's
own folder (the `--dir` passed to `build`/`check`, relative to the repo
root) from bucket matching — committing the explainer's own source inside
the diff range (e.g. right after `/explain` commits it) never counts as an
unmatched or changed path. Never add the artifact's own folder to
`buckets[]` yourself; it's handled automatically. A generator can also
declare `exclude: [<glob>, ...]` (same glob syntax as `buckets[].match`) for
any other self-generated path that shouldn't appear in the manifest either.

## When to use

- A large or moderate set of changed files a reader should be able to filter
  (by bucket, by added/modified/deleted, by path substring) rather than
  scroll through linearly.
- Pairs with `code`: file-map for the overview/filter, `code` (optionally
  inside `details` accordions) for the full contents of any one file.

## When not

- A handful of files (under ~10) with nothing to filter — list them plainly,
  or use `code`/`details` directly.
- Field-level annotation of one JSON payload — use `annotated-json`.

## Markup contract

```html
<div class="ex-file-map" data-source="manifest" data-default-on="core,adapters"
     data-repo-base="https://github.com/org/repo/blob/branch/">
  <x-include g="manifest" as="data"/>
  <div class="ex-file-map-controls">
    <div class="ex-file-map-legend" role="group" aria-label="Filter by bucket"></div>
    <input type="search" class="ex-file-map-search" placeholder="Search a path…" aria-label="Search changed files by path">
    <div class="ex-file-map-status" role="group" aria-label="Filter by change type">
      <button type="button" data-status="all" aria-pressed="true">All</button>
      <button type="button" data-status="A" aria-pressed="false">Added</button>
      <button type="button" data-status="M" aria-pressed="false">Modified</button>
      <button type="button" data-status="D" aria-pressed="false">Deleted</button>
    </div>
    <button type="button" class="ex-file-map-show-all">Show all buckets</button>
    <span class="ex-file-map-count"></span>
  </div>
  <div class="ex-file-map-groups"></div>
</div>
```

- Root class `ex-file-map` on the wrapper `<div>`; `file-map.js` finds every
  one on the page and is a no-op if there are none (or if its data hasn't
  resolved to a `{files:[...]}` shape).
- **`<x-include g="<generator id>" as="data"/>`** is the data source — the
  build expands it (`lib/includes.mjs`'s `handleInclude`) to a sibling
  `<script type="application/json" class="ex-data" data-gen="<id>"
  data-at="…">` holding that generator's fresh output verbatim (never
  hand-typed, and re-run on every build, so it can't go stale — follow-up fixing the original drift). Omit `at=` to get the generator's
  whole `{files, counts}` output (as here); `at="files"` gets just the
  array. Place it anywhere inside `.ex-file-map` (or, with `data-source`,
  anywhere on the page) — `file-map.js` looks for a nested `.ex-data`
  first, then an immediately-following sibling, then (if `data-source` is
  set) any `.ex-data[data-gen="<data-source>"]` on the page.
- `data-source` (optional): the generator id to match against
  `.ex-data[data-gen]` when the data block isn't nested/adjacent.
- `data-default-on` (optional): a comma-separated list of bucket ids open by
  default; everything else starts collapsed behind "Show all buckets."
  Defaults to every bucket (derived from the data itself — see below).
- `data-repo-base` (optional): if set, each path renders as a link to
  `repoBase + path` (new tab); otherwise plain monospace text.
- **Bucket labels are the bucket id verbatim.** The generator's own output
  carries ids only (`files[].bucket`, `counts`'s keys) — the human label
  lives in `contents.json`'s generator config (`buckets[].label`), which
  isn't part of the generator's JSON output and so isn't available to
  `file-map.js` client-side. `file-map.js` derives its bucket list directly
  from the unique `bucket` values in `files[]`, in first-seen order, and
  uses each id as its own label.
- The rest of the markup (`.ex-file-map-controls`, the legend/search/status/
  show-all/count elements, `.ex-file-map-groups`) is exactly what
  `file-map.js` expects by class name — copy it from `example.html` as-is;
  only the `<x-include>`'s generator id and the container's data attributes
  vary.

## Tokens used

`--ex-border`, `--ex-border-strong`, `--ex-bg`, `--ex-bg-elevated`,
`--ex-bg-sunken`, `--ex-ink`, `--ex-ink-muted`, `--ex-ink-faint`,
`--ex-accent`, `--ex-accent-soft`, `--ex-focus`, `--ex-status-good`,
`--ex-status-caution`, `--ex-status-bad`.
