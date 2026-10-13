# table

Real `<table>` with a scroll wrapper, ● ◐ ○ grade cells, a legend line, and an
optional highlighted "pick" row.

## When to use

- Comparing options against criteria where each cell is a short grade (strong /
  partial / weak), optionally with one row called out as the pick.
- Any reference table (key/value, list of items) that benefits from a sticky
  header and a bounded-width scroll wrapper rather than reflowing on phones.

## When not

- A two-axis comparison where *both* the row and column are enumerated
  categories (not just "option vs criterion") — use `matrix` instead, which
  adds sticky row headers and verdict-coloured cells.
- A short list of numbered conclusions — use `verdict-list`.

## Markup contract

```html
<div class="ex-table">
  <table>
    <thead>
      <tr><th>…</th>…</tr>
    </thead>
    <tbody>
      <tr class="ex-table-pick"><td>…</td>…</tr>
      <tr><td><span class="ex-grade ex-grade--good">●</span> …</td>…</tr>
    </tbody>
  </table>
  <p class="ex-table-legend">
    <span class="ex-grade ex-grade--good">●</span> strong ·
    <span class="ex-grade ex-grade--caution">◐</span> partial ·
    <span class="ex-grade ex-grade--bad">○</span> weak.
  </p>
</div>
```

- Root class `ex-table` goes on the wrapper `<div>` — it is both the pattern's
  trigger class and the scroll/border box. A plain `<table>` with no wrapper
  never gets this pattern's CSS (and risks page-level horizontal overflow).
- `ex-table-pick` on a `<tr>` highlights that row (the accent-soft background).
- `ex-grade ex-grade--good|caution|bad` marks a grade cell/glyph; pair the glyph
  (●/◐/○) with a short word, never colour alone.
- `ex-table-legend` is an optional `<p>` (or any block) inside the wrapper,
  below the table, spelling out what the glyphs mean.
- No JS; `table.js` is not shipped.

## Tokens used

`--ex-border`, `--ex-bg-sunken`, `--ex-ink-muted`, `--ex-accent-soft`,
`--ex-status-good`, `--ex-status-caution`, `--ex-status-bad`.
