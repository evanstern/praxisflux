# legend

A standalone row of same / changed / new swatches, for use above or beside a diagram, or wherever that vocabulary
applies outside a diagram's own box.

## When to use

- Explaining the same/changed/new colour key once, near a diagram (or a group
  of diagrams) that otherwise relies on the reader already knowing it.
- Any other visual that reuses the same green/amber/blue-dashed vocabulary.

## When not

- Inside `.ex-diagram` itself — a diagram's own legend row is emitted by the
  diagram generator/hand-SVG using `.ex-legend-same` / `-changed` / `-new`
  directly (shell-owned, shell-owned); this
  pattern is for a *standalone* legend outside that box.
- A table's ●/◐/○ grade key — that's `table`'s own `.ex-table-legend`.

## Markup contract

```html
<div class="ex-legend">
  <span class="ex-legend-title">Key:</span>
  <span class="ex-legend-same">Unchanged</span>
  <span class="ex-legend-changed">Changed</span>
  <span class="ex-legend-new">New</span>
</div>
```

- Root class `ex-legend` goes on the row container — it is this pattern's only
  CSS contribution; the swatch colours themselves come from shell.css's
  shell-owned `.ex-legend-same` / `.ex-legend-changed` / `.ex-legend-new`
  (always present, never pattern-collected).
- `ex-legend-title` is an optional leading label.
- No JS; `legend.js` is not shipped.

## Tokens used

None of its own — `--ex-ink-muted` / `--ex-ink-faint` for layout text only. The
swatch colours (`--ex-diagram-same`, `-changed`, `-new` and their `-bg` pairs)
belong to shell.css, not this pattern.
