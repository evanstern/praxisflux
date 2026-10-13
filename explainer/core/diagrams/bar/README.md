# `bar` diagram generator

A bar chart — horizontal (one row per bar, the default) or vertical (one
column per bar) — **always** paired with a real data table of the same
values. One of the five mechanical layouts, and the one calls out specifically: "bar always emits a data
table next to the chart," because a bar's exact value is never reliably
readable from its length alone. There is no `bars`-only mode — every `bar`
diagram gets a table; if a page doesn't want one, it shouldn't use `bar`.

## Data shape (`schema.json`, `example.json`)

```json
{
  "title": "p50 latency by adapter",
  "unit": "ms",
  "orientation": "horizontal",
  "bars": [
    { "label": "GitHubAdapter", "value": 420, "panel": "github" },
    { "label": "AdoAdapter", "value": 610, "new": true }
  ]
}
```

- `orientation` — `"horizontal"` (default) or `"vertical"`.
- `unit` — appended to every value label and to the table's "Value" header, e.g. `"ms"`.
- `bars[]` — at least one, drawn in array order (top to bottom horizontal, left to
  right vertical):
  - `label` (required) — wraps to the row/column's width budget.
  - `value` (required, number) — bar length/height is proportional to this, scaled
    against the largest value in the set.
  - `new` — draws the bar with the shared "new" class instead of "same", and marks
    the table row's Status cell "New".
  - `panel` — a `contents.json` page's `panels[].key`; makes the bar a clickable node.

## The contract extension: `render()` returns `{ svg, minWidth, html }`

Every other core generator returns `{ svg, minWidth }`. `bar` adds a third,
optional field — `html`, already-built markup rendered immediately after the
`svg` inside the same `.ex-diagram` wrapper `lib/includes.mjs`'s
`handleDiagram` creates (see `core/diagrams/README.md` for the full contract
this extends). `bar` sets it to a real `<table>`:

```html
<table>
  <caption>p50 latency by adapter — data</caption>
  <thead><tr><th scope="col">Label</th><th scope="col">Value (ms)</th><th scope="col">Status</th></tr></thead>
  <tbody>
    <tr><th scope="row">GitHubAdapter</th><td>420ms</td><td></td></tr>
    <tr><th scope="row">AdoAdapter</th><td>610ms</td><td>New</td></tr>
  </tbody>
</table>
```

- The table is semantic HTML (`<caption>`/`<th scope="col">`/`<th scope="row">`),
  not a visual re-skin of the chart — it's there so the exact numbers are always
  readable and copy/paste-able, independent of the SVG.
- The `caption` is only present when `data.title` is set.
- The third column ("Status") is only emitted when at least one bar has `new: true`
  — a chart with no "new" bars gets a plain two-column table.
- The table carries no classes and no inline styles of its own (no colour, no
  `var()`) — it inherits only the page's own prose table styling, if any; it is
  not currently wired to a shared `table` content pattern.

## Layout notes

- Bar length/height is scaled against the *largest* value in the set (not a fixed
  unit), so one call always fits regardless of the data's magnitude.
- Every label wraps to a fixed per-row (horizontal) or per-column (vertical) width
  budget; a label that still can't fit — one word alone wider than the budget, or
  more lines than its limit — throws a build error naming the bar
  (`core/diagrams/_shared/text.mjs`'s `wrapToBudget`), never silent overflow.
- A vertical chart's category-label block height is measured once, up front, from
  the tallest wrapped label, before any svg is emitted (same two-pass approach as
  `timeline`/`swimlanes`).
