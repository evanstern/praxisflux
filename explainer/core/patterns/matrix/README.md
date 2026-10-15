# matrix

X × Y matrix with sticky row and column headers and verdict-coloured cells.
Covers both a reachability/"hit" read and
a severity read (constraint vs. candidate shape) with one shared cell
vocabulary.

## When to use

- Two enumerated axes (row category × column category), where you need to scan
  both a row and a column while scrolled — e.g. "which stage calls which
  operation", or "how does this constraint read against each candidate design".
- A severity/verdict read per cell (good / caution / bad), rather than a free
  value.

## When not

- One axis is "options", the other is "criteria" scored with a grade glyph and
  one row is the pick — use `table` (its `.ex-table-pick` + `.ex-grade` do that
  more directly).
- A flat key/value or reference table — use `table`.

## Markup contract

```html
<div class="ex-matrix">
  <table>
    <thead>
      <tr><th class="ex-matrix-rowhead">…</th><th>…</th>…</tr>
    </thead>
    <tbody>
      <tr><th class="ex-matrix-rowhead">…</th><td class="ex-cell--good">…</td>…</tr>
    </tbody>
  </table>
</div>
```

- Root class `ex-matrix` goes on the wrapper `<div>` — the scroll wrapper and
  the pattern's trigger class.
- `ex-matrix-rowhead` on the corner `<th>` (in `thead`) and on each row's first
  `<th>` (in `tbody`) makes both the top row and the left column sticky while
  scrolling the other axis.
- Cell modifiers, each a class on the `<td>`: `ex-cell--hit` (reachable,
  accent), `ex-cell--indirect` (reachable only indirectly, muted italic),
  `ex-cell--good` / `ex-cell--caution` / `ex-cell--bad` (the shared
  good/caution/bad status read `table`'s grade cells also use), and
  `ex-cell--note` (a left-aligned explanatory cell, typically with `colspan`).
- No JS; `matrix.js` is not shipped.

## Tokens used

`--ex-border`, `--ex-bg-sunken`, `--ex-ink`, `--ex-ink-muted`, `--ex-ink-faint`,
`--ex-accent`, `--ex-accent-soft`,
`--ex-status-good` / `-good-bg`, `--ex-status-caution` / `-caution-bg`,
`--ex-status-bad` / `-bad-bg`.
