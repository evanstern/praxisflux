# stats

Stat tile strip.

## When to use

- A handful of standalone numbers worth calling out together (counts,
  percentages, durations) — each tile is one number plus one short label.

## When not

- A number that belongs inside a sentence or table cell — stats are for
  pull-quote-style emphasis, not routine data.
- A set of linked choices — use `cards`.

## Markup contract

```html
<div class="ex-stats">
  <div class="ex-stat">
    <span class="ex-stat-num">42</span>
    <span class="ex-stat-lbl">Label</span>
  </div>
</div>
```

- Root class `ex-stats` goes on the grid container; each tile is `ex-stat`.
- `ex-stat-num` holds the number/value (any short string); `ex-stat-lbl` holds
  the one-line label below it.
- No JS; `stats.js` is not shipped.

## Tokens used

`--ex-border`, `--ex-bg-elevated`, `--ex-shadow`, `--ex-accent`, `--ex-ink-muted`.
