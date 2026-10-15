# cards

Card grid for related pages, options, or links.

## When to use

- A small set of choices or related pages the reader should scan at a glance —
  each with a short title and one line of body copy.
- Both linking cards (`<a class="ex-card">`) and non-linking cards
  (`<div class="ex-card">`, e.g. a static highlight) are supported.

## When not

- Numeric highlights (a count, a percentage) — use `stats`.
- A list of short answers in order — use `verdict-list`.

## Markup contract

```html
<div class="ex-cards">
  <a class="ex-card" href="#page">
    <p class="ex-card-title">Title</p>
    <p class="ex-card-body">One line of body copy.</p>
  </a>
</div>
```

- Root class `ex-cards` goes on the grid container; each item is `ex-card`
  (either `<a>` or any non-interactive element).
- `ex-card-title` / `ex-card-body` are the two expected children; any extra
  content after them inherits the card's padding.
- No JS; `cards.js` is not shipped.

## Tokens used

`--ex-border`, `--ex-border-strong`, `--ex-bg-elevated`, `--ex-shadow`,
`--ex-ink`, `--ex-ink-muted`, `--ex-accent`.
